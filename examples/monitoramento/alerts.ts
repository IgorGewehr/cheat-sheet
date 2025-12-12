import { logger } from './logger'

type AlertLevel = 'info' | 'warning' | 'critical'

type Alert = {
  level: AlertLevel
  title: string
  message: string
  context?: Record<string, any>
}

export async function sendAlert(alert: Alert) {
  // Log sempre
  logger[alert.level === 'critical' ? 'error' : 'warn']({
    alert: true,
    ...alert,
  }, alert.title)

  // Slack para warnings e critical
  if (alert.level !== 'info') {
    await sendSlackAlert(alert)
  }

  // PagerDuty apenas para critical
  if (alert.level === 'critical') {
    await sendPagerDuty(alert)
  }
}

async function sendSlackAlert(alert: Alert) {
  const color = alert.level === 'critical' ? '#ff0000' : '#ffcc00'

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: Object.entries(alert.context || {}).map(([k, v]) => ({
          title: k,
          value: String(v),
          short: true,
        })),
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  })
}

// Uso:
// await sendAlert({
//   level: 'critical',
//   title: 'Taxa de erro alta',
//   message: 'Mais de 10% das requisições estão falhando',
//   context: { errorRate: '15%', endpoint: '/api/checkout' },
// })