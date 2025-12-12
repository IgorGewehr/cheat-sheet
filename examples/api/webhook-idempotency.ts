// Armazena eventos processados para evitar duplicacao
async function processWebhook(eventId: string, handler: () => Promise<void>) {
  // Verifica se ja processou
  const existing = await db.webhookEvent.findUnique({
    where: { eventId }
  })

  if (existing) {
    console.log(`Event ${eventId} already processed`)
    return
  }

  // Processa
  await handler()

  // Marca como processado
  await db.webhookEvent.create({
    data: {
      eventId,
      processedAt: new Date(),
    }
  })
}

// Uso:
await processWebhook(event.id, async () => {
  await handleSubscriptionChange(subscription)
})
