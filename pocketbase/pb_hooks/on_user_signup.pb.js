// Hook to enforce default role and active status on user creation
onRecordCreate((e) => {
  if (!e.record.getString('role')) {
    e.record.set('role', 'Usuario')
  }
  // If not explicitly set, keep active as false for new registrations until admin activation
  if (e.record.get('ativo') === undefined || e.record.get('ativo') === null) {
    e.record.set('ativo', false)
  }
  if (!e.record.getString('theme')) {
    e.record.set('theme', 'claro')
  }
  e.next()
}, '_pb_users_auth_')
