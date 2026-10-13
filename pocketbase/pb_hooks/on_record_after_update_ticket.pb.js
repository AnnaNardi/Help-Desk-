// Hook executed after updating a ticket: tracks status/technician/priority changes and creates notifications
onRecordAfterUpdateSuccess((e) => {
  e.next()

  try {
    const ticketId = e.record.id
    const numero = e.record.getString('numero')
    const title = e.record.getString('title')
    const requesterId = e.record.getString('requester')
    const currentTechId = e.record.getString('technician')
    const oldTechId = e.record.original().getString('technician')

    const currentStatus = e.record.getString('status')
    const oldStatus = e.record.original().getString('status')

    const currentPriority = e.record.getString('priority')
    const oldPriority = e.record.original().getString('priority')

    const histCol = $app.findCollectionByNameOrId('ticket_history')
    const notifCol = $app.findCollectionByNameOrId('notifications')

    // 1. Detect technician change
    if (currentTechId !== oldTechId) {
      const hRec = new Record(histCol)
      hRec.set('ticket', ticketId)
      hRec.set('type', 'assign')
      hRec.set('description', 'Técnico responsável alterado.')
      $app.save(hRec)

      if (currentTechId) {
        const notifNew = new Record(notifCol)
        notifNew.set('user', currentTechId)
        notifNew.set('type', 'ticket_assigned')
        notifNew.set('title', 'Chamado atribuído: ' + numero)
        notifNew.set('message', 'Você foi designado para o chamado: ' + title)
        notifNew.set('ticket', ticketId)
        notifNew.set('read', false)
        $app.save(notifNew)
      }
      if (oldTechId) {
        const notifOld = new Record(notifCol)
        notifOld.set('user', oldTechId)
        notifOld.set('type', 'ticket_unassigned')
        notifOld.set('title', 'Chamado redistribuído: ' + numero)
        notifOld.set('message', 'O chamado ' + numero + ' foi atribuído a outro técnico.')
        notifOld.set('ticket', ticketId)
        notifOld.set('read', false)
        $app.save(notifOld)
      }
    }

    // 2. Detect priority change
    if (currentPriority !== oldPriority) {
      const hRec = new Record(histCol)
      hRec.set('ticket', ticketId)
      hRec.set('type', 'priority_change')
      hRec.set(
        'description',
        'Prioridade alterada de ' + oldPriority + ' para ' + currentPriority + '.',
      )
      $app.save(hRec)
    }

    // 3. Detect status change
    if (currentStatus !== oldStatus) {
      let type = 'status_change'
      let desc = 'Status alterado de ' + oldStatus + ' para ' + currentStatus + '.'
      if (currentStatus === 'Fechado') {
        type = 'close'
        desc = 'Chamado encerrado/fechado.'
      } else if (oldStatus === 'Fechado' && currentStatus === 'Aberto') {
        type = 'reopen'
        desc = 'Chamado reaberto pelo solicitante/técnico.'
      } else if (currentStatus === 'Agendado') {
        type = 'schedule'
        desc =
          'Chamado agendado para: ' +
          (e.record.getString('scheduled_for') || 'data combinada') +
          '. ' +
          e.record.getString('scheduled_note')
      }

      const hRec = new Record(histCol)
      hRec.set('ticket', ticketId)
      hRec.set('type', type)
      hRec.set('description', desc)
      $app.save(hRec)

      // Notify requester
      if (requesterId) {
        const notifReq = new Record(notifCol)
        notifReq.set('user', requesterId)
        notifReq.set('type', 'ticket_status')
        notifReq.set('title', 'Chamado ' + numero + ': ' + currentStatus)
        notifReq.set('message', 'O status do seu chamado foi atualizado para ' + currentStatus)
        notifReq.set('ticket', ticketId)
        notifReq.set('read', false)
        $app.save(notifReq)
      }

      // Notify technician if different
      if (currentTechId && currentTechId !== requesterId) {
        const notifT = new Record(notifCol)
        notifT.set('user', currentTechId)
        notifT.set('type', 'ticket_status')
        notifT.set('title', 'Chamado ' + numero + ': ' + currentStatus)
        notifT.set('message', 'Status atualizado para: ' + currentStatus)
        notifT.set('ticket', ticketId)
        notifT.set('read', false)
        $app.save(notifT)
      }
    }

    // 4. Activity log
    try {
      const logCol = $app.findCollectionByNameOrId('activity_logs')
      const logRec = new Record(logCol)
      logRec.set('action', 'ticket_update')
      logRec.set('entity_type', 'ticket')
      logRec.set('entity_id', ticketId)
      logRec.set('details', {
        numero: numero,
        status: currentStatus,
        priority: currentPriority,
        technician: currentTechId,
      })
      $app.save(logRec)
    } catch (_) {}
  } catch (err) {
    console.log('Error in onRecordAfterUpdateSuccess tickets:', err)
  }
}, 'tickets')
