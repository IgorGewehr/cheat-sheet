import { db } from './db'
import { logger } from './logger'

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.settings.update'
  | 'payment.created'
  | 'payment.refunded'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'member.invited'
  | 'member.removed'
  | 'data.exported'
  | 'data.deleted'

type AuditLog = {
  action: AuditAction
  userId: string
  targetId?: string
  targetType?: string
  metadata?: Record<string, any>
  ip?: string
  userAgent?: string
}

export async function audit(log: AuditLog) {
  // 1. Salva no banco
  await db.auditLog.create({
    data: {
      action: log.action,
      userId: log.userId,
      targetId: log.targetId,
      targetType: log.targetType,
      metadata: log.metadata || {},
      ip: log.ip,
      userAgent: log.userAgent,
    },
  })

  // 2. Log estruturado
  logger.info({
    type: 'audit',
    ...log,
  }, `Audit: ${log.action}`)

  // 3. Alerta para ações críticas
  if (isCriticalAction(log.action)) {
    await sendSecurityAlert(log)
  }
}

function isCriticalAction(action: AuditAction) {
  return [
    'data.exported',
    'data.deleted',
    'api_key.created',
    'member.removed',
  ].includes(action)
}

// Uso:
// await audit({
//   action: 'api_key.created',
//   userId: session.user.id,
//   metadata: { keyName: 'Production Key' },
//   ip: request.ip,
// })