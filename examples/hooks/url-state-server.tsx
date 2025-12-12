// Server Component - lê direto dos params
export default function ProductsPage({
  searchParams
}: {
  searchParams: { page?: string; filter?: string }
}) {
  const page = Number(searchParams.page) || 1
  const filter = searchParams.filter || 'all'

  return <ProductList page={page} filter={filter} />
}