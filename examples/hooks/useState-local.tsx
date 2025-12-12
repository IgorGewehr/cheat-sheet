'use client'
import { useState } from 'react'

function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {title} {isOpen ? '▼' : '▶'}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}