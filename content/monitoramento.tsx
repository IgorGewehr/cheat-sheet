import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function MonitoramentoLogs() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Monitoramento & Logs
      </h1>

      <NoteBox type="info" title="Pilares do Observability">
        <ul className="list-disc list-inside">
          <li><strong>Logs</strong> - O que aconteceu</li>
          <li><strong>Metrics</strong> - Quanto/Quando aconteceu</li>
          <li><strong>Traces</strong> - Caminho da requisição</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Logger Estruturado com Pino
      </h3>

      <CodeBlockFile
        file="monitoramento/logger.ts"
        fileName="lib/logger.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Request Logger Middleware
      </h3>

      <CodeBlockFile
        file="monitoramento/request-logger.ts"
        fileName="lib/middleware/request-logger.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Sentry para Error Tracking
      </h3>

      <CodeBlockFile
        file="monitoramento/sentry.ts"
        fileName="lib/sentry.ts"
      />

      <CodeBlockFile
        file="monitoramento/global-error.tsx"
        fileName="app/global-error.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Métricas com Prometheus
      </h3>

      <CodeBlockFile
        file="monitoramento/metrics.ts"
        fileName="lib/metrics.ts"
      />

      <CodeBlockFile
        file="monitoramento/metrics-route.ts"
        fileName="app/api/metrics/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Audit Log para Ações Críticas
      </h3>

      <CodeBlockFile
        file="monitoramento/audit.ts"
        fileName="lib/audit.ts"
      />

      <CodeBlockFile
        file="monitoramento/audit-schema.prisma"
        fileName="prisma/schema.prisma"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Health Check Endpoint
      </h3>

      <CodeBlockFile
        file="monitoramento/health-route.ts"
        fileName="app/api/health/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Alertas e Notificações
      </h3>

      <CodeBlockFile
        file="monitoramento/alerts.ts"
        fileName="lib/alerts.ts"
      />

      <NoteBox type="info" title="Stack Recomendada">
        <ul className="list-disc list-inside">
          <li><strong>Logs</strong>: Pino + Axiom ou Datadog</li>
          <li><strong>Errors</strong>: Sentry</li>
          <li><strong>Metrics</strong>: Prometheus + Grafana</li>
          <li><strong>Uptime</strong>: Better Uptime ou Checkly</li>
          <li><strong>Alertas</strong>: Slack + PagerDuty</li>
        </ul>
      </NoteBox>
    </div>
  )
}
