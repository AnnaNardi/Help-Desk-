// Hook executed after creating a preventiva
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const prevId = e.record.id
    const desc = e.record.getString('description')
    const techId = e.record.getString('technician')
    const scheduled = e.record.getString('scheduled_date')

    if (techId) {
      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCol)
      notif.set('user', techId)
      notif.set('type', 'preventiva_created')
      notif.set('title', 'Nova Preventiva Agendada')
      notif.set(
        'message',
        'Preventiva atribuída a você para ' +
          (scheduled ? scheduled.slice(0, 10) : '') +
          ': ' +
          desc.slice(0, 80),
      )
      notif.set('preventiva', prevId)
      notif.set('read', false)
      $app.save(notif)
    }

    // Activity log
    try {
      const logCol = $app.findCollectionByNameOrId('activity_logs')
      const logRec = new Record(logCol)
      logRec.set('action', 'preventiva_create')
      logRec.set('entity_type', 'preventiva')
      logRec.set('entity_id', prevId)
      logRec.set('details', { description: desc, scheduled_date: scheduled })
      $app.save(logRec)
    } catch (_) {}
  } catch (err) {
    console.log('Error in onRecordAfterCreateSuccess preventivas:', err)
  }
}, 'preventivas')
