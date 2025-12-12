const [isPending, startTransition] = useTransition()

function handleSearch(query: string) {
  // Update urgente - input responsivo
  setQuery(query)

  // Update não-urgente - pode "atrasar"
  startTransition(() => {
    setFilteredResults(heavyFilter(data, query))
  })
}

return (
  <>
    <input value={query} onChange={e => handleSearch(e.target.value)} />
    {isPending ? <Spinner /> : <Results data={filteredResults} />}
  </>
)