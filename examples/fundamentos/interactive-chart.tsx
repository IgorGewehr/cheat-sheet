'use client' // Marca como Client Component

import { useState } from 'react'

export default function InteractiveChart({ data }) {
  const [filter, setFilter] = useState('all')

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">Todos</option>
        <option value="week">Última Semana</option>
      </select>
      {/* Chart interativo aqui */}
    </div>
  )
}