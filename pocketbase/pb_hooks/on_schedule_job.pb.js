// Cron job to notify technicians about preventivas in the next 48h
cronAdd('check_upcoming_preventivas', '0 8 * * *', () => {
  try {
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 3600 * 1000)

    const nowStr = now.toISOString()
    const in48hStr = in48h.toISOString()

    const preventivas = $app.findRecordsByFilter(
      'preventivas',
      "status = 'Agendada' && scheduled_date >= '" +
        nowStr +
        "' && scheduled_date <= '" +
        in48hStr +
        "'",
      'scheduled_date',
      100,
      0,
    )

    const notifCol = $app.findCollectionByNameOrId('notifications')

    for (let i = 0; i < preventivas.length; i++) {
      const p = preventivas[i]
      const techId = p.getString('technician')
      if (!techId) continue

      // Check if notification already exists for this preventiva and user
      try {
        const existing = $app.findRecordsByFilter(
          'notifications',
          "user = '" + techId + "' && preventiva = '" + p.id + "' && type = 'preventiva_upcoming'",
          '',
          1,
          0,
        )
        if (existing.length > 0) {
          continue // already notified
        }
      } catch (_) {}

      const n = new Record(notifCol)
      n.set('user', techId)
      n.set('type', 'preventiva_upcoming')
      n.set('title', 'Lembrete: Preventiva próxima')
      n.set(
        'message',
        "A preventiva '" +
          p.getString('description').slice(0, 60) +
          "...' está programada para as próximas 48 horas.",
      )
      n.set('preventiva', p.id)
      n.set('read', false)
      $app.save(n)
    }
  } catch (err) {
    console.log('Error in cron check_upcoming_preventivas:', err)
  }
})
