// Este componente é async - pode usar await diretamente!
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products')
    .then(res => res.json())

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}