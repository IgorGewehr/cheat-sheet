import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
      <p className="text-gray-600 mb-4">
        O produto que você procura não existe ou foi removido.
      </p>
      <Link
        href="/products"
        className="text-blue-500 hover:underline"
      >
        Ver todos os produtos
      </Link>
    </div>
  )
}