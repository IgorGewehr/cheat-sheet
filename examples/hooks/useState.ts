const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)

// Atualização baseada no valor anterior
setCount(prev => prev + 1)

// Lazy initialization (só executa uma vez)
const [data, setData] = useState(() => expensiveComputation())