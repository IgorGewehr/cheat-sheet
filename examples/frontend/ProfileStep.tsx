type StepProps = {
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
}