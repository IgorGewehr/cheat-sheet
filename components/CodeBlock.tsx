'use client'

import { useState } from 'react'

type CodeBlockProps = {
  code: string
  fileName?: string
  language?: string
}

export default function CodeBlock({ code, fileName, language = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple syntax highlighting
  const highlightCode = (code: string): string => {
    return code
      // Comments
      .replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
      // Strings
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="code-string">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="code-string">$1</span>')
      .replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="code-string">$1</span>')
      // Keywords
      .replace(/\b(import|export|from|const|let|var|function|async|await|return|if|else|try|catch|throw|new|class|extends|implements|interface|type|enum|public|private|protected|static|readonly|default|as|typeof|instanceof)\b/g, '<span class="code-keyword">$1</span>')
      // Types
      .replace(/\b(string|number|boolean|null|undefined|void|any|never|unknown|Promise|Array|Record|Partial|Required|Pick|Omit)\b/g, '<span class="code-type">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
      // Functions (before parenthesis)
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="code-function">$1</span>(')
  }

  return (
    <div className="relative group my-4">
      <pre className="bg-code-bg p-5 rounded-lg overflow-x-auto border border-slate-700 text-sm leading-relaxed">
        {/* File name badge */}
        {fileName && (
          <span className="absolute top-0 right-0 bg-slate-700 text-white text-xs px-3 py-1 rounded-bl-lg font-mono">
            {fileName}
          </span>
        )}

        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs"
          aria-label="Copiar código"
        >
          {copied ? (
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        <code
          className="font-mono text-slate-200"
          dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
        />
      </pre>
    </div>
  )
}
