import { getCodeExample } from '@/lib/code-examples'
import CodeBlock from './CodeBlock'

type CodeBlockFileProps = {
  file: string
  fileName?: string
}

export default function CodeBlockFile({ file, fileName }: CodeBlockFileProps) {
  const code = getCodeExample(file)
  const displayName = fileName || file.split('/').pop() || file

  return <CodeBlock code={code} fileName={displayName} />
}
