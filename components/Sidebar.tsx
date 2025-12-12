'use client'

import { useState } from 'react'

export type NavItem = {
  id: string
  label: string
  icon: string
}

export type NavCategory = {
  title: string
  items: NavItem[]
}

type SidebarProps = {
  categories: NavCategory[]
  activeSection: string
  onSectionChange: (id: string) => void
  onOpenSearch: () => void
}

export default function Sidebar({ categories, activeSection, onSectionChange, onOpenSearch }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-secondary rounded-lg border border-slate-700"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-[280px] bg-bg-secondary border-r border-slate-700
          flex flex-col overflow-y-auto
          transform transition-transform duration-200
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-lg font-bold text-accent flex items-center gap-2">
            Architect Guide
            <span className="text-xs text-text-secondary font-normal">v2.0</span>
          </h2>

          {/* Search button */}
          <button
            onClick={onOpenSearch}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary bg-bg-primary rounded-lg border border-slate-700 hover:border-accent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Buscar...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-bg-secondary rounded">⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-2">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id)
                      setIsMobileOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all
                      ${activeSection === item.id
                        ? 'bg-accent/10 text-accent border-l-2 border-accent'
                        : 'text-text-secondary hover:bg-accent/5 hover:text-text-primary'
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-text-secondary">
          Next.js 15 + App Router
        </div>
      </aside>
    </>
  )
}
