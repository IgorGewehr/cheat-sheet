'use client'

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
            className={`
              flex-1 h-2 rounded-full
              ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}
            `}
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
}