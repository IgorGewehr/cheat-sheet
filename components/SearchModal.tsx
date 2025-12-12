'use client'

import { useState, useEffect, useRef } from 'react'
import type { NavCategory } from './Sidebar'

type SearchModalProps = {
  isOpen: boolean
  onClose: () => void
  categories: NavCategory[]
  onSelect: (id: string) => void
}

export default function SearchModal({ isOpen, onClose, categories, onSelect }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Flatten all items for search
  const allItems = categories.flatMap(cat =>
    cat.items.map(item => ({ ...item, category: cat.title }))
  )

  const filteredItems = query
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex].id)
          onClose()
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] search-backdrop bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg-secondary rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar seções..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary outline-none"
          />
          <kbd className="px-2 py-1 text-xs bg-bg-primary text-text-secondary rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-text-secondary">
              Nenhum resultado encontrado
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id)
                  onClose()
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${index === selectedIndex ? 'bg-accent/20 text-accent' : 'hover:bg-bg-primary text-text-primary'}
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-text-secondary">{item.category}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 p-3 border-t border-slate-700 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-bg-primary rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-bg-primary rounded">↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-bg-primary rounded">↵</kbd>
            selecionar
          </span>
        </div>
      </div>
    </div>
  )
}
