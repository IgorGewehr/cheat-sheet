import ical from 'node-ical'

type Booking = {
  uid: string
  start: Date
  end: Date
  summary: string
  source: 'airbnb' | 'booking' | 'other'
}

export async function parseIcal(url: string): Promise<Booking[]> {
  const events = await ical.async.fromURL(url)
  const bookings: Booking[] = []

  for (const event of Object.values(events)) {
    if (event.type !== 'VEVENT') continue

    // Detecta a fonte pelo conteúdo
    const source = event.summary?.includes('Airbnb')
      ? 'airbnb'
      : event.summary?.includes('Booking')
        ? 'booking'
        : 'other'

    bookings.push({
      uid: event.uid,
      start: new Date(event.start),
      end: new Date(event.end),
      summary: event.summary || 'Reserva',
      source,
    })
  }

  return bookings
}

export async function syncPropertyCalendar(property: {
  id: string
  icalUrl: string
}) {
  const bookings = await parseIcal(property.icalUrl)
  const newBookings = []

  for (const booking of bookings) {
    // Upsert: cria ou atualiza
    const result = await db.booking.upsert({
      where: {
        propertyId_externalId: {
          propertyId: property.id,
          externalId: booking.uid,
        }
      },
      create: {
        propertyId: property.id,
        externalId: booking.uid,
        startDate: booking.start,
        endDate: booking.end,
        source: booking.source,
        title: booking.summary,
      },
      update: {
        startDate: booking.start,
        endDate: booking.end,
        title: booking.summary,
      },
    })

    newBookings.push(result)
  }

  return newBookings
}