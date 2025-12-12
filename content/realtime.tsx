import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function RealtimeChat() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Chat em Tempo Real
      </h1>

      <NoteBox type="info" title="Quando usar?">
        Chat entre usuários, notificações ao vivo, dashboards que atualizam sozinhos.
        Para isso, usamos <strong>WebSockets</strong> ou serviços como <strong>Pusher/Ably</strong>.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Opções de Arquitetura
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Solução</th>
            <th>Prós</th>
            <th>Contras</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pusher / Ably</td>
            <td>Fácil, escala sozinho, sem servidor</td>
            <td>Custo por mensagem</td>
          </tr>
          <tr>
            <td>Supabase Realtime</td>
            <td>Já vem com o Supabase, grátis até certo ponto</td>
            <td>Só funciona com Supabase</td>
          </tr>
          <tr>
            <td>Socket.io próprio</td>
            <td>Controle total, sem custos de terceiros</td>
            <td>Precisa de servidor separado</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Exemplo com Pusher (Recomendado)
      </h3>

      <p className="text-text-secondary mb-4">
        Pusher cuida de toda a infraestrutura. Você só envia e recebe mensagens.
      </p>

      <CodeBlockFile
        file="realtime/pusher.ts"
        fileName="lib/pusher.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Enviando Mensagem (Server Action)
      </h3>

      <CodeBlockFile
        file="realtime/chat-actions.ts"
        fileName="app/chat/actions.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Recebendo Mensagens (Client)
      </h3>

      <CodeBlockFile
        file="realtime/chat-messages.tsx"
        fileName="app/chat/[chatId]/ChatMessages.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Isolamento por Tenant
      </h3>

      <NoteBox type="warning" title="Importante">
        Em SaaS multi-tenant, cada tenant deve ter seu próprio canal.
        Nunca misture mensagens de tenants diferentes!
      </NoteBox>

      <CodeBlockFile
        file="realtime/tenant-isolation.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Indicador "Digitando..."
      </h3>

      <CodeBlockFile
        file="realtime/typing-indicator.ts"
      />
    </div>
  )
}

export function CronJobs() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Jobs Agendados (Cron)
      </h1>

      <NoteBox type="info" title="Casos de Uso">
        Sincronizar calendários (iCal), enviar emails em lote, limpar dados antigos,
        gerar relatórios diários, verificar status de integrações.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Opções de Arquitetura
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Solução</th>
            <th>Melhor para</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel Cron</td>
            <td>Jobs simples, já hospedado na Vercel</td>
          </tr>
          <tr>
            <td>QStash (Upstash)</td>
            <td>Jobs que precisam de retry, filas</td>
          </tr>
          <tr>
            <td>Trigger.dev</td>
            <td>Jobs complexos, workflows</td>
          </tr>
          <tr>
            <td>BullMQ + Redis</td>
            <td>Controle total, alto volume</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Exemplo: Sync iCal (Airbnb/Booking)
      </h3>

      <p className="text-text-secondary mb-4">
        A cada 30 minutos, busca reservas do Airbnb e Booking via iCal.
      </p>

      <CodeBlockFile
        file="realtime/vercel-cron.json"
        fileName="vercel.json"
      />

      <CodeBlockFile
        file="realtime/sync-calendars-route.ts"
        fileName="app/api/cron/sync-calendars/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Parser de iCal
      </h3>

      <CodeBlockFile
        file="realtime/ical-parser.ts"
        fileName="lib/ical.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Com Fila (QStash)
      </h3>

      <NoteBox type="success" title="Quando usar fila?">
        Quando você tem muitos itens para processar e não pode fazer tudo em 1 request.
        A fila processa um por um, com retry automático se falhar.
      </NoteBox>

      <CodeBlockFile
        file="realtime/qstash-queue.ts"
      />
    </div>
  )
}
