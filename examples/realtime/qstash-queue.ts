import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

// Agenda job para daqui 30 minutos
await qstash.publishJSON({
  url: 'https://meuapp.com/api/jobs/sync-property',
  body: { propertyId: '123' },
  delay: 30 * 60, // 30 minutos em segundos
})

// Ou adiciona à fila para processar agora
await qstash.publishJSON({
  url: 'https://meuapp.com/api/jobs/sync-property',
  body: { propertyId: '123' },
})