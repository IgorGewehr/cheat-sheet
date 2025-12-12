'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setFilter(filter: string) {
    const params = new URLSearchParams(searchParams)
    params.set('filter', filter)
    params.set('page', '1') // Reset page
    router.push(`?${params.toString()}`)
  }

  return (
    <select
      value={searchParams.get('filter') || 'all'}
      onChange={(e) => setFilter(e.target.value)}
    >
      <option value="all">Todos</option>
      <option value="active">Ativos</option>
    </select>
  )
}