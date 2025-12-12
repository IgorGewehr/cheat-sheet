'use client'
import { useActionState } from 'react'
import { createUser } from './actions'

export function Form() {
  const [state, action, isPending] = useActionState(createUser, null)

  return (
    <form action={action}>
      <input name="email" />
      {state?.errors?.email && <p>{state.errors.email}</p>}

      <button disabled={isPending}>
        {isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}