// Endpoint seguro para redefinição de senha de usuários por Administradores:
// Exige autenticação com papel 'Admin', atualiza a senha do usuário especificado,
// cria registro em activity_logs e notificação interna para o usuário afetado.
routerAdd(
  'POST',
  '/backend/v1/custom/admin-reset-password',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, {
        success: false,
        message: 'Acesso não autenticado.',
      })
    }

    // Verifica se o usuário autenticado é Admin
    const adminRole = authRecord.getString('role')
    if (adminRole !== 'Admin') {
      return e.json(403, {
        success: false,
        message: 'Apenas Administradores do sistema podem redefinir senhas de outros usuários.',
      })
    }

    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    const targetUserId = (body.userId || '').toString().trim()
    const newPassword = (body.password || '').toString().trim()
    const ticketId = (body.ticketId || '').toString().trim()

    if (!targetUserId) {
      return e.json(400, {
        success: false,
        message: 'Identificador do usuário alvo não informado.',
      })
    }

    if (!newPassword || newPassword.length < 8) {
      return e.json(400, {
        success: false,
        message: 'A nova senha deve ter no mínimo 8 caracteres.',
      })
    }

    // Localiza o usuário alvo
    let targetUser = null
    try {
      targetUser = $app.findRecordById('_pb_users_auth_', targetUserId)
    } catch (_) {
      return e.json(404, {
        success: false,
        message: 'Usuário não encontrado.',
      })
    }

    const targetUserName = targetUser.getString('name') || targetUser.getString('email')
    const targetUserEmail = targetUser.getString('email')
    const adminName = authRecord.getString('name') || 'Administrador'
    const adminId = authRecord.id

    // Atualiza a senha do usuário
    targetUser.setPassword(newPassword)
    $app.save(targetUser)

    // 1. Criar notificação interna para o usuário afetado
    try {
      const notifCol = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCol)
      notif.set('user', targetUserId)
      notif.set('type', 'password_reset_by_admin')
      notif.set('title', 'Sua senha de acesso foi redefinida')
      notif.set(
        'message',
        'Um administrador (' +
          adminName +
          ') redefiniu a sua senha de acesso. Utilize a nova credencial fornecida pela equipe de suporte.',
      )
      if (ticketId) {
        notif.set('ticket', ticketId)
      }
      notif.set('read', false)
      $app.save(notif)
    } catch (errNotif) {
      console.log('Erro ao criar notificação de redefinição de senha:', errNotif)
    }

    // 2. Registrar em activity_logs
    try {
      const logCol = $app.findCollectionByNameOrId('activity_logs')
      const logRec = new Record(logCol)
      logRec.set('user', adminId)
      logRec.set('action', 'user_password_reset')
      logRec.set('entity_type', 'user')
      logRec.set('entity_id', targetUserId)
      logRec.set('details', {
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        target_user_email: targetUserEmail,
        reset_by_admin_id: adminId,
        reset_by_admin_name: adminName,
        ticket_id: ticketId || null,
        timestamp: new Date().toISOString(),
      })
      $app.save(logRec)
    } catch (errLog) {
      console.log('Erro ao registrar log de redefinição de senha:', errLog)
    }

    // 3. Se houver ticketId associado, adiciona histórico ao chamado registrando a ação
    if (ticketId) {
      try {
        const histCol = $app.findCollectionByNameOrId('ticket_history')
        const histRec = new Record(histCol)
        histRec.set('ticket', ticketId)
        histRec.set('type', 'service')
        histRec.set('user', adminId)
        histRec.set(
          'description',
          'Senha de acesso redefinida pelo Administrador ' +
            adminName +
            ' para o usuário ' +
            targetUserName +
            '.',
        )
        histRec.set('service_details', {
          atendimento_descricao: 'Redefinição de senha executada com sucesso.',
          realizado: 'Nova senha gerada e aplicada pelo painel de T.I.',
          solucao: 'Senha de acesso do usuário atualizada com segurança.',
        })
        $app.save(histRec)
      } catch (errHist) {
        console.log('Erro ao registrar histórico no chamado:', errHist)
      }
    }

    return e.json(200, {
      success: true,
      message: 'Senha do usuário ' + targetUserName + ' redefinida com sucesso!',
      userId: targetUserId,
      userName: targetUserName,
      password: newPassword,
    })
  },
  $apis.requireAuth(),
)
