import dynamic from 'next/dynamic'

// Componente pesado carregado sob demanda
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Se não precisa de SSR
})

// Múltiplos componentes do mesmo módulo
const { Modal, Dialog } = dynamic(() => import('./ui'), {
  loading: () => <Spinner />,
})

// Carrega apenas quando visível (intersection observer)
const LazySection = dynamic(() => import('./LazySection'), {
  loading: () => <SectionSkeleton />,
})

export default function Page() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      {/* Chart só carrega quando a página renderiza */}
      <HeavyChart data={data} />

      {/* Modal só carrega quando abre */}
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  )
}
