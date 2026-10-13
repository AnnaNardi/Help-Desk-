// Hook executed after creating a ticket: history, notifications and activity log
onRecordAfterCreateSuccess((e) => {
  e.next()

  try {
    const ticketId = e.record.id
    const numero = e.record.getString('numero')
    const title = e.record.getString('title')
    const requesterId = e.record.getString('requester')
    const technicianId = e.record.getString('technician')

    // 1. Create history entry
    const histCol = $app.findCollectionByNameOrId('ticket_history')
    const histRec = new Record(histCol)
    histRec.set('ticket', ticketId)
    histRec.set('type', 'create')
    histRec.set('user', requesterId)
    histRec.set('description', 'Chamado aberto: ' + title)
    $app.save(histRec)

    // 2. Notifications
    const notifCol = $app.findCollectionByNameOrId('notifications')

    // Notify assigned technician if present
    if (technicianId) {
      const notifTec = new Record(notifCol)
      notifTec.set('user', technicianId)
      notifTec.set('type', 'ticket_assigned')
      notifTec.set('title', 'Novo chamado atribuído ' + numero)
      notifTec.set('message', 'Você foi designado como responsável pelo chamado: ' + title)
      notifTec.set('ticket', ticketId)
      notifTec.set('read', false)
      $app.save(notifTec)
    }

    // Notify Admins
    try {
      const admins = $app.findRecordsByFilter('users', "role = 'Admin'", '', 10, 0)
      for (let i = 0; i < admins.length; i++) {
        const adminId = admins[i].id
        if (adminId !== requesterId && adminId !== technicianId) {
          const notifAdmin = new Record(notifCol)
          notifAdmin.set('user', adminId)
          notifAdmin.set('type', 'ticket_created')
          notifAdmin.set('title', 'Novo chamado aberto: ' + numero)
          notifAdmin.set('message', 'Chamado aberto: ' + title)
          notifAdmin.set('ticket', ticketId)
          notifAdmin.set('read', false)
          $app.save(notifAdmin)
        }
      }
    } catch (_) {}

    // 3. Activity log
    try {
      const logCol = $app.findCollectionByNameOrId('activity_logs')
      const logRec = new Record(logCol)
      logRec.set('user', requesterId)
      logRec.set('action', 'ticket_create')
      logRec.set('entity_type', 'ticket')
      logRec.set('entity_id', ticketId)
      logRec.set('details', {
        numero: numero,
        title: title,
        priority: e.record.getString('priority'),
        technician: technicianId,
      })
      $app.save(logRec)
    } catch (_) {}
  } catch (err) {
    console.log('Error in onRecordAfterCreateSuccess tickets:', err)
  }
}, 'tickets')
