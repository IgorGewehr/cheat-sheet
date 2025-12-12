import { generateApiKey } from '@/lib/api-keys'
import { auth } from '@/lib/auth'

export default async function ApiKeysPage() {
  const session = await auth()
  const keys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">API Keys</h1>

      <CreateKeyForm userId={session.user.id} />

      <div className="mt-8 space-y-4">
        {keys.map(key => (
          <div key={key.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{key.name}</h3>
                <code className="text-sm text-gray-500">{key.keyPrefix}...</code>
              </div>
              <DeleteKeyButton keyId={key.id} />
            </div>

            <div className="mt-2 flex gap-2">
              {key.scopes.map(scope => (
                <span key={scope} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {scope}
                </span>
              ))}
            </div>

            {key.lastUsedAt && (
              <p className="mt-2 text-sm text-gray-500">
                Último uso: {key.lastUsedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}