import fs from 'fs'
import path from 'path'

const EXAMPLES_DIR = path.join(process.cwd(), 'examples')

export function getCodeExample(filePath: string): string {
  const fullPath = path.join(EXAMPLES_DIR, filePath)

  try {
    return fs.readFileSync(fullPath, 'utf-8')
  } catch (error) {
    console.error(`Failed to read example file: ${filePath}`)
    return `// Example file not found: ${filePath}`
  }
}
