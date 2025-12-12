'use client'

import { useState } from 'react'

type CodeBlockProps = {
  code: string
  fileName?: string
}

export default function CodeBlock({ code, fileName }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Syntax highlighting simples e seguro usando inline styles
  // para evitar conflitos com keywords como "class"
  const highlightCode = (code: string): string => {
    const lines = code.split('\n')

    // Cores como inline styles para evitar conflitos
    const colors = {
      comment: 'color: #64748b; font-style: italic',
      string: 'color: #4ade80',
      keyword: 'color: #c084fc',
      type: 'color: #facc15',
      number: 'color: #fb923c',
    }

    return lines.map(line => {
      // Linha de comentário completa
      if (line.trim().startsWith('//')) {
        return `<span style="${colors.comment}">${escapeHtml(line)}</span>`
      }

      // Linha de comentário de bloco
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return `<span style="${colors.comment}">${escapeHtml(line)}</span>`
      }

      // Escape HTML primeiro para segurança
      let escaped = escapeHtml(line)

      // Strings (ordem importa - template literals primeiro)
      escaped = escaped.replace(/(`[^`]*`)/g, `<span style="${colors.string}">$1</span>`)
      escaped = escaped.replace(/(&apos;[^&]*&apos;|&quot;[^&]*&quot;)/g, `<span style="${colors.string}">$1</span>`)
      escaped = escaped.replace(/(&#39;[^&]*&#39;)/g, `<span style="${colors.string}">$1</span>`)

      // Keywords
      const keywords = [
        'import', 'export', 'from', 'const', 'let', 'var', 'function',
        'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw',
        'new', 'class', 'extends', 'interface', 'type', 'enum',
        'default', 'as', 'typeof', 'instanceof', 'for', 'while', 'switch', 'case'
      ]
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b(${kw})\\b`, 'g')
        escaped = escaped.replace(regex, `<span style="${colors.keyword}">$1</span>`)
      })

      // Types
      const types = ['string', 'number', 'boolean', 'null', 'undefined', 'void', 'any', 'Promise', 'Array', 'Record']
      types.forEach(t => {
        const regex = new RegExp(`\\b(${t})\\b`, 'g')
        escaped = escaped.replace(regex, `<span style="${colors.type}">$1</span>`)
      })

      // Números (não match números em inline styles)
      escaped = escaped.replace(/(?<![:;#\d])(\b\d+\b)(?![a-fA-F\d]*[;"])/g, `<span style="${colors.number}">$1</span>`)

      return escaped
    }).join('\n')
  }

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  return (
    <div className="relative group my-4">
      {/* File name badge */}
      {fileName && (
        <div className="bg-slate-800 text-slate-400 text-xs px-4 py-2 rounded-t-lg border border-b-0 border-slate-700 font-mono">
          {fileName}
        </div>
      )}

      <pre className={`bg-slate-900 p-4 overflow-x-auto border border-slate-700 text-sm leading-relaxed ${fileName ? 'rounded-b-lg rounded-t-none' : 'rounded-lg'}`}>
        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
          aria-label="Copiar código"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>

        <code
          className="font-mono text-slate-300 text-sm"
          dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
        />
      </pre>
    </div>
  )
}
