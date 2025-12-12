import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function RouteHandlers() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Route Handlers
      </h1>

      <NoteBox type="info" title="Quando usar Route Handlers?">
        <ul className="list-disc list-inside">
          <li>Webhooks de serviços externos</li>
          <li>APIs para consumo externo (mobile app, integrações)</li>
          <li>Upload de arquivos</li>
          <li>Streaming de respostas</li>
        </ul>
        <p className="mt-2">Para mutações internas, prefira <strong>Server Actions</strong>.</p>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura Básica
      </h3>

      <CodeBlockFile file="api/route-handlers-basic.ts" fileName="app/api/users/route.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rotas Dinâmicas
      </h3>

      <CodeBlockFile file="api/route-handlers-dynamic.ts" fileName="app/api/users/[id]/route.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Middleware Pattern para APIs
      </h3>

      <CodeBlockFile file="api/middleware-pattern.ts" fileName="lib/api/middleware.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Configurações de Rota
      </h3>

      <CodeBlockFile file="api/route-config.ts" />
    </div>
  )
}

export function ExternalAPIs() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        External APIs Integration
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Client com Retry e Timeout
      </h3>

      <CodeBlockFile file="api/api-client.ts" fileName="lib/api-client.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Service Layer Pattern
      </h3>

      <CodeBlockFile file="api/stripe-service.ts" fileName="lib/services/stripe.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rate Limiting com Exponential Backoff
      </h3>

      <CodeBlockFile file="api/fetch-backoff.ts" />

      <NoteBox type="warning" title="Secrets em APIs Externas">
        <ul className="list-disc list-inside">
          <li>Nunca exponha API keys no cliente</li>
          <li>Use Route Handlers ou Server Actions como proxy</li>
          <li>Armazene secrets em variáveis de ambiente</li>
          <li>Rotacione keys regularmente</li>
        </ul>
      </NoteBox>
    </div>
  )
}

export function Webhooks() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Webhooks
      </h1>

      <NoteBox type="danger" title="Segurança em Webhooks">
        <strong>SEMPRE</strong> verifique a assinatura do webhook antes de processar.
        Sem verificação, qualquer pessoa pode enviar requests falsos.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Webhook Stripe Completo
      </h3>

      <CodeBlockFile file="api/webhook-stripe.ts" fileName="app/api/webhooks/stripe/route.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Idempotência em Webhooks
      </h3>

      <CodeBlockFile file="api/webhook-idempotency.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Configuração no middleware.ts
      </h3>

      <CodeBlockFile file="api/webhook-middleware.ts" />

      <NoteBox type="success" title="Boas Práticas">
        <ul className="list-disc list-inside space-y-1">
          <li>Sempre retorne 200 rapidamente (processe async se necessário)</li>
          <li>Implemente idempotência (eventos podem ser enviados mais de uma vez)</li>
          <li>Log todos os eventos para debugging</li>
          <li>Configure alertas para falhas de processamento</li>
        </ul>
      </NoteBox>
    </div>
  )
}
