'use client'

import { useActionState } from 'react'
import { createUser } from '../actions'

export default function NewUserPage() {
  const [state, action, isPending] = useActionState(createUser, null)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          name="name"
          required
          className={state?.errors?.name ? 'border-red-500' : ''}
        />
        {state?.errors?.name && (
          <p className="text-red-500 text-sm">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-sm">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          required
        />
        {state?.errors?.password && (
          <p className="text-red-500 text-sm">{state.errors.password[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select id="role" name="role">
          <option value="user">Usuário</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {state?.message && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? 'Criando...' : 'Criar Usuário'}
      </button>
    </form>
  )
}
