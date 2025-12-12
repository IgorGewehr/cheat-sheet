// useMemo - memoriza VALOR
const expensiveValue = useMemo(
  () => computeExpensive(data),
  [data]
)

// useCallback - memoriza FUNÇÃO
const handleClick = useCallback(
  () => doSomething(id),
  [id]
)