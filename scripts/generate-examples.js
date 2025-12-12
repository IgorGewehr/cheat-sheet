const fs = require('fs')
const path = require('path')

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples')
const OUTPUT_FILE = path.join(__dirname, '..', 'lib', 'generated-examples.ts')

function getAllFiles(dir, baseDir = dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir))
    } else {
      const relativePath = path.relative(baseDir, fullPath)
      files.push({ relativePath, fullPath })
    }
  }

  return files
}

function escapeForTemplate(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
}

function main() {
  const files = getAllFiles(EXAMPLES_DIR)
  const examples = {}

  for (const { relativePath, fullPath } of files) {
    const content = fs.readFileSync(fullPath, 'utf-8')
    // Normalize path separators for Windows compatibility
    const normalizedPath = relativePath.replace(/\\/g, '/')
    examples[normalizedPath] = content
  }

  const output = `// Auto-generated file - do not edit manually
// Run: node scripts/generate-examples.js

export const codeExamples: Record<string, string> = {
${Object.entries(examples)
  .map(([key, value]) => `  '${key}': \`${escapeForTemplate(value)}\``)
  .join(',\n')}
}
`

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8')
  console.log(`Generated ${Object.keys(examples).length} examples to ${OUTPUT_FILE}`)
}

main()
