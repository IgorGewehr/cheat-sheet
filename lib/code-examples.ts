import { codeExamples } from './generated-examples'

export function getCodeExample(filePath: string): string {
  const code = codeExamples[filePath]

  if (!code) {
    console.error(`Example file not found: ${filePath}`)
    return `// Example file not found: ${filePath}`
  }

  return code
}
