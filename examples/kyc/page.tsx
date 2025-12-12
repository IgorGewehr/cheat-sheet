'use client'

import { useState } from 'react'
import { submitKYC } from './actions'

export default function KYCPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verificação de Identidade</h1>

      {step === 1 && (
        <PersonalDataStep onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <DocumentStep onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}

      {step === 3 && (
        <SelfieStep onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}

      {step === 4 && (
        <SuccessStep />
      )}
    </div>
  )
}

function DocumentStep({ onNext, onBack }) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Tire foto do seu documento (RG ou CNH)
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Frente</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {frontFile && (
          <img
            src={URL.createObjectURL(frontFile)}
            alt="Preview"
            className="mt-2 rounded"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Verso</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setBackFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!frontFile || !backFile}>
          Continuar
        </Button>
      </div>
    </div>
  )
}