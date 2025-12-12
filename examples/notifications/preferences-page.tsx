import { auth } from '@/lib/auth'

const NOTIFICATION_TYPES = [
  { type: 'ORDER_CREATED', label: 'Novos pedidos', category: 'Pedidos' },
  { type: 'ORDER_SHIPPED', label: 'Pedido enviado', category: 'Pedidos' },
  { type: 'PAYMENT_RECEIVED', label: 'Pagamento recebido', category: 'Financeiro' },
  { type: 'PAYMENT_FAILED', label: 'Pagamento falhou', category: 'Financeiro' },
  { type: 'NEW_COMMENT', label: 'Novos comentários', category: 'Social' },
  { type: 'SECURITY_ALERT', label: 'Alertas de segurança', category: 'Segurança' },
  { type: 'WEEKLY_DIGEST', label: 'Resumo semanal', category: 'Marketing' },
]

export default async function NotificationPreferencesPage() {
  const session = await auth()

  const preferences = await db.notificationPreference.findMany({
    where: { userId: session!.user.id },
  })

  const prefMap = Object.fromEntries(
    preferences.map(p => [p.type, p])
  )

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Preferências de Notificação</h1>

      <form action={updatePreferences}>
        {Object.entries(
          NOTIFICATION_TYPES.reduce((acc, t) => {
            acc[t.category] = acc[t.category] || []
            acc[t.category].push(t)
            return acc
          }, {} as Record<string, typeof NOTIFICATION_TYPES>)
        ).map(([category, types]) => (
          <div key={category} className="mb-8">
            <h2 className="font-semibold mb-4">{category}</h2>

            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2 text-center">In-App</th>
                  <th className="pb-2 text-center">Email</th>
                  <th className="pb-2 text-center">Push</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => {
                  const pref = prefMap[t.type] || { inApp: true, email: true, push: true }
                  return (
                    <tr key={t.type} className="border-t">
                      <td className="py-3">{t.label}</td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={`${t.type}.inApp`}
                          defaultChecked={pref.inApp}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={`${t.type}.email`}
                          defaultChecked={pref.email}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={`${t.type}.push`}
                          defaultChecked={pref.push}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Salvar Preferências
        </button>
      </form>
    </div>
  )
}
