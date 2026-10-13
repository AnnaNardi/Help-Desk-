// Hook executed before updating a ticket: sets closed_at when status becomes Fechado
onRecordUpdate((e) => {
  const newStatus = e.record.getString('status')
  const oldStatus = e.record.original().getString('status')

  if (newStatus === 'Fechado' && oldStatus !== 'Fechado') {
    if (!e.record.getString('closed_at')) {
      e.record.set('closed_at', new Date().toISOString())
    }
  } else if (newStatus !== 'Fechado' && oldStatus === 'Fechado') {
    // Reopening ticket
    e.record.set('closed_at', '')
  }

  e.next()
}, 'tickets')
