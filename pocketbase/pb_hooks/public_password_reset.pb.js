// Endpoint público para solicitação de redefinição de senha:
// Cria automaticamente um chamado de suporte vinculado ao usuário e sua empresa,
// ou avisa se já existir chamado aberto em andamento.
routerAdd('POST', '/backend/v1/custom/password-reset-request', (e) => {
  let body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  const email = (body.email || '').toString().trim().toLowerCase()
  if (!email) {
    return e.json(400, {
      success: false,
      message: 'Informe um endereço de e-mail válido.',
    })
  }

  // Busca o usuário pelo e-mail
  let userRecord = null
  try {
    userRecord = $app.findAuthRecordByEmail('_pb_users_auth_', email)
  } catch (_) {
    // Se não encontrou o usuário, retorna resposta genérica de sucesso por segurança
    return e.json(200, {
      success: true,
      exists: false,
      message:
        'Se o e-mail informado estiver cadastrado e ativo em nosso sistema, o chamado foi registrado para a equipe de T.I.',
    })
  }

  // Verifica se o usuário está ativo
  if (userRecord.getBool('ativo') === false) {
    return e.json(200, {
      success: true,
      exists: false,
      message:
        'Se o e-mail informado estiver cadastrado e ativo em nosso sistema, o chamado foi registrado para a equipe de T.I.',
    })
  }

  const userId = userRecord.id
  const userName = userRecord.getString('name') || 'Usuário'
  const companyId = userRecord.getString('company')

  // Se não possuir empresa vinculada, pega a primeira empresa cadastrada ou nula
  let finalCompanyId = companyId
  if (!finalCompanyId) {
    try {
      const companies = $app.findRecordsByFilter('companies', '', '', 1, 0)
      if (companies.length > 0) {
        finalCompanyId = companies[0].id
      }
    } catch (_) {}
  }

  if (!finalCompanyId) {
    return e.json(500, {
      success: false,
      message: 'Não há nenhuma empresa cadastrada para associar ao chamado.',
    })
  }

  // Evitar duplicidade: verificar se já existe chamado aberto/em andamento/agendado de redefinição para esse usuário
  const existingTickets = $app.findRecordsByFilter(
    'tickets',
    "requester = {:userId} && (status = 'Aberto' || status = 'Em andamento' || status = 'Agendado') && title ~ 'Redefinição de senha'",
    '-created',
    1,
    0,
    { userId: userId },
  )

  if (existingTickets.length > 0) {
    const existingNum = existingTickets[0].getString('numero') || 'em andamento'
    return e.json(200, {
      success: true,
      exists: true,
      alreadyOpen: true,
      ticketNumero: existingNum,
      message:
        'Já existe uma solicitação de redefinição de senha em andamento para esta conta (' +
        existingNum +
        '). A equipe de T.I. já está atendendo.',
    })
  }

  // Criar o chamado de redefinição de senha
  const ticketsCol = $app.findCollectionByNameOrId('tickets')
  const newTicket = new Record(ticketsCol)
  newTicket.set('numero', 'AUTO')
  newTicket.set('company', finalCompanyId)
  newTicket.set('requester', userId)
  newTicket.set('title', 'Solicitação de redefinição de senha — ' + userName)
  newTicket.set(
    'description',
    'Solicitação automática gerada pela tela de Esqueci Minha Senha.\n\n' +
      'Usuário Solicitante: ' +
      userName +
      '\n' +
      'E-mail: ' +
      userRecord.getString('email') +
      '\n' +
      'Telefone / Ramal: ' +
      (userRecord.getString('phone') || 'Não informado') +
      '\n' +
      'Tipo de Solicitação: Redefinição de Senha de Acesso\n\n' +
      'Instruções para o T.I.: Utilize a ação rápida "Redefinir Senha do Solicitante" para gerar ou definir uma nova senha segura, passe-a ao solicitante e encerre o chamado.',
  )
  newTicket.set('priority', 'Média')
  newTicket.set('status', 'Aberto')
  newTicket.set('opened_at', new Date().toISOString())

  $app.save(newTicket)

  return e.json(200, {
    success: true,
    exists: true,
    ticketId: newTicket.id,
    ticketNumero: newTicket.getString('numero'),
    message:
      'Sua solicitação de redefinição de senha foi registrada com sucesso (Chamado ' +
      newTicket.getString('numero') +
      '). A equipe de suporte fará o atendimento.',
  })
})
