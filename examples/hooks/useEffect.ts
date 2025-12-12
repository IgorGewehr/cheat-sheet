// Executa em toda renderização
useEffect(() => {
  console.log('rendered')
})

// Executa apenas na montagem
useEffect(() => {
  console.log('mounted')
}, [])

// Executa quando 'id' muda + cleanup
useEffect(() => {
  const controller = new AbortController()

  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then(res => res.json())
    .then(setUser)

  return () => controller.abort() // Cleanup!
}, [id])