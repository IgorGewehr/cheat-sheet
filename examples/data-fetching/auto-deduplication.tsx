// O Next.js deduplica automaticamente requests GET idênticos
// durante uma única renderização

// Componente A
async function Header() {
  const user = await fetch('/api/user') // Request 1
  return <div>{user.name}</div>
}

// Componente B
async function Sidebar() {
  const user = await fetch('/api/user') // Reutiliza Request 1!
  return <div>{user.avatar}</div>
}

// Apenas 1 request é feito na prática