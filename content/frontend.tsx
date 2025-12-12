import CodeBlock from '@/components/CodeBlock'
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

      <CodeBlock
        code={`components/
├── ui/                    # Atoms - Componentes básicos
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── Spinner.tsx
│
├── shared/                # Molecules - Composições simples
│   ├── SearchInput.tsx    # Input + ícone + botão limpar
│   ├── FormField.tsx      # Label + Input + erro
│   └── UserAvatar.tsx     # Avatar + nome + badge online
│
└── organisms/             # Organisms - Seções completas
    ├── Header/
    │   ├── index.tsx
    │   ├── NavLinks.tsx
    │   └── UserMenu.tsx
    │
    └── Onboarding/
        ├── index.tsx
        ├── StepIndicator.tsx
        ├── steps/
        │   ├── WelcomeStep.tsx
        │   ├── ProfileStep.tsx
        │   └── CompanyStep.tsx
        └── hooks/
            └── useOnboarding.ts`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Button com Variantes
      </h3>

      <CodeBlock
        fileName="components/ui/Button.tsx"
        code={`import { forwardRef } from 'react'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const variants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'hover:bg-gray-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={\`
          rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          \${variants[variant]}
          \${sizes[size]}
        \`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Carregando...
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Modal / Dialog
      </h3>

      <CodeBlock
        fileName="components/ui/Dialog.tsx"
        code={`'use client'

import { useEffect, useRef } from 'react'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="
        backdrop:bg-black/50
        rounded-xl p-0 max-w-md w-full
        animate-in fade-in zoom-in-95
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </dialog>
  )
}

// Uso:
// <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Confirmar">
//   <p>Tem certeza?</p>
//   <Button onClick={handleConfirm}>Sim</Button>
// </Dialog>`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Animações com CSS
      </h3>

      <CodeBlock
        fileName="app/globals.css"
        code={`/* Animação de entrada */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Classes utilitárias */
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideIn { animation: slideIn 0.3s ease-out; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out; }

/* Transição suave para hover */
.transition-all {
  transition: all 0.2s ease;
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Onboarding Multi-Step
      </h3>

      <CodeBlock
        fileName="components/organisms/Onboarding/index.tsx"
        code={`'use client'

import { useState } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { ProfileStep } from './steps/ProfileStep'
import { CompanyStep } from './steps/CompanyStep'

const steps = [
  { id: 'welcome', title: 'Bem-vindo', component: WelcomeStep },
  { id: 'profile', title: 'Seu Perfil', component: ProfileStep },
  { id: 'company', title: 'Sua Empresa', component: CompanyStep },
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState({})

  const CurrentStepComponent = steps[currentStep].component

  function handleNext(stepData: object) {
    setData(prev => ({ ...prev, ...stepData }))

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Último step - salvar dados
      handleComplete({ ...data, ...stepData })
    }
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Indicador de progresso */}
      <div className="flex gap-2 mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={\`
              flex-1 h-2 rounded-full
              \${index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}
            \`}
          />
        ))}
      </div>

      {/* Título do step */}
      <h1 className="text-2xl font-bold mb-6">
        {steps[currentStep].title}
      </h1>

      {/* Conteúdo do step */}
      <div className="animate-fadeIn">
        <CurrentStepComponent
          data={data}
          onNext={handleNext}
          onBack={currentStep > 0 ? handleBack : undefined}
        />
      </div>
    </div>
  )
}`}
      />

      <CodeBlock
        fileName="components/organisms/Onboarding/steps/ProfileStep.tsx"
        code={`type StepProps = {
  data: Record<string, any>
  onNext: (data: object) => void
  onBack?: () => void
}

export function ProfileStep({ data, onNext, onBack }: StepProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    onNext({
      name: formData.get('name'),
      phone: formData.get('phone'),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input
          name="name"
          defaultValue={data.name}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Telefone</label>
        <input
          name="phone"
          defaultValue={data.phone}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button type="button" variant="secondary" onClick={onBack}>
            Voltar
          </Button>
        )}
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Toast / Notificações
      </h3>

      <CodeBlock
        fileName="components/ui/Toast.tsx"
        code={`'use client'

import { createContext, useContext, useState } from 'react'

type Toast = { id: string; message: string; type: 'success' | 'error' }

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function toast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])

    // Remove após 3 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Container de toasts */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={\`
              px-4 py-2 rounded-lg animate-slideIn
              \${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
              text-white
            \`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)!

// Uso:
// const { toast } = useToast()
// toast('Salvo com sucesso!')
// toast('Erro ao salvar', 'error')`}
      />
    </div>
  )
}
