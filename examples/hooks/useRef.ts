// Referência ao DOM
const inputRef = useRef<HTMLInputElement>(null)
inputRef.current?.focus()

// Valor mutável que persiste
const renderCount = useRef(0)
renderCount.current++ // Não causa re-render!

// Guardar valor anterior
const prevValue = useRef(value)
useEffect(() => {
  prevValue.current = value
}, [value])