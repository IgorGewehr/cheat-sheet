import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function SistemaNotificacoes() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Sistema de Notificações
      </h1>

      <NoteBox type="info" title="Canais de Notificação">
        <ul className="list-disc list-inside">
          <li><strong>In-App</strong> - Sino no header, lista de notificações</li>
          <li><strong>Push</strong> - Browser/Mobile push notifications</li>
          <li><strong>Email</strong> - Transacionais e digest</li>
          <li><strong>SMS</strong> - Alertas críticos (2FA, fraude)</li>
          <li><strong>Webhook</strong> - Para integrações B2B</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Schema de Notificações
      </h3>

      <CodeBlockFile
        file="notifications/schema.prisma"
        fileName="prisma/schema.prisma"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Serviço de Notificações
      </h3>

      <CodeBlockFile
        file="notifications/service.ts"
        fileName="lib/notifications/service.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Canal: Email com React Email
      </h3>

      <CodeBlockFile
        file="notifications/email.ts"
        fileName="lib/notifications/channels/email.ts"
      />

      <CodeBlockFile
        file="notifications/OrderShipped.tsx"
        fileName="emails/OrderShipped.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Canal: Push Notifications
      </h3>

      <CodeBlockFile
        file="notifications/push.ts"
        fileName="lib/notifications/channels/push.ts"
      />

      <CodeBlockFile
        file="notifications/subscribe-route.ts"
        fileName="app/api/push/subscribe/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Hook para Registrar Push
      </h3>

      <CodeBlockFile
        file="notifications/usePushNotifications.ts"
        fileName="hooks/usePushNotifications.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Componente de Notificações In-App
      </h3>

      <CodeBlockFile
        file="notifications/NotificationBell.tsx"
        fileName="components/NotificationBell.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        API de Notificações
      </h3>

      <CodeBlockFile
        file="notifications/notifications-route.ts"
        fileName="app/api/notifications/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Preferências de Notificação
      </h3>

      <CodeBlockFile
        file="notifications/preferences-page.tsx"
        fileName="app/settings/notifications/page.tsx"
      />

      <NoteBox type="info" title="Boas Práticas">
        <ul className="list-disc list-inside">
          <li>Sempre permita opt-out de emails de marketing</li>
          <li>Agrupe notificações similares (digest)</li>
          <li>Respeite fuso horário do usuário</li>
          <li>Limite frequência (no máximo X por hora)</li>
          <li>Mantenha histórico para auditoria</li>
        </ul>
      </NoteBox>
    </div>
  )
}
