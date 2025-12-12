import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function FrontendReact() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Frontend React
      </h1>

      <NoteBox type="info" title="Organização de Componentes">
        Use a estrutura <strong>Atomic Design</strong>: atoms → molecules → organisms → templates → pages.
        Comece simples e refatore conforme cresce.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura de Componentes
      </h3>

      <CodeBlockFile
        file="frontend/component-structure.txt"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Button com Variantes
      </h3>

      <CodeBlockFile
        file="frontend/Button.tsx"
        fileName="components/ui/Button.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Modal / Dialog
      </h3>

      <CodeBlockFile
        file="frontend/Dialog.tsx"
        fileName="components/ui/Dialog.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Animações com CSS
      </h3>

      <CodeBlockFile
        file="frontend/animations.css"
        fileName="app/globals.css"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Onboarding Multi-Step
      </h3>

      <CodeBlockFile
        file="frontend/Onboarding.tsx"
        fileName="components/organisms/Onboarding/index.tsx"
      />

      <CodeBlockFile
        file="frontend/ProfileStep.tsx"
        fileName="components/organisms/Onboarding/steps/ProfileStep.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Toast / Notificações
      </h3>

      <CodeBlockFile
        file="frontend/Toast.tsx"
        fileName="components/ui/Toast.tsx"
      />
    </div>
  )
}
