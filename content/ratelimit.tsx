import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function RateLimitingAPI() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Rate Limiting & API Pública
      </h1>

      <NoteBox type="danger" title="Por que Rate Limiting?">
        Sem rate limiting, sua API pode ser:
        <ul className="list-disc list-inside mt-2">
          <li>Sobrecarregada por bots ou scrapers</li>
          <li>Usada para ataques DDoS</li>
          <li>Explorada para enumerar dados</li>
          <li>Custosa demais por uso abusivo</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rate Limiter com Upstash Redis
      </h3>

      <CodeBlockFile file="ratelimit/rate-limit.ts" fileName="lib/rate-limit.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Middleware de Rate Limit
      </h3>

      <CodeBlockFile file="ratelimit/middleware.ts" fileName="middleware.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Sistema de API Keys
      </h3>

      <CodeBlockFile file="ratelimit/schema.prisma" fileName="prisma/schema.prisma" />

      <CodeBlockFile file="ratelimit/api-keys.ts" fileName="lib/api-keys.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rate Limit por Plano
      </h3>

      <CodeBlockFile file="ratelimit/rate-limit-by-plan.ts" fileName="lib/rate-limit-by-plan.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        API Pública - Route Handler
      </h3>

      <CodeBlockFile file="ratelimit/api-route.ts" fileName="app/api/v1/[...path]/route.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Documentação da API (OpenAPI)
      </h3>

      <CodeBlockFile file="ratelimit/openapi-route.ts" fileName="app/api/docs/openapi.json/route.ts" />

      <NoteBox type="info" title="Swagger UI">
        Use <strong>swagger-ui-react</strong> ou hospede em <strong>/api-docs</strong> para documentação visual.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Dashboard de API Keys
      </h3>

      <CodeBlockFile file="ratelimit/api-keys-page.tsx" fileName="app/settings/api-keys/page.tsx" />
    </div>
  )
}
