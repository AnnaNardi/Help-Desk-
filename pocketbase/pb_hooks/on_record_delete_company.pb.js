// Hook executed before deleting a company to prevent deletion of structural/system records
onRecordDelete((e) => {
  const nomeFantasia = (e.record.getString('nome_fantasia') || '').trim().toLowerCase()
  // Protect generic structural records by name; never rely on instance-specific IDs.
  if (
    nomeFantasia === 'organização interna' ||
    nomeFantasia === 'organizacao interna' ||
    nomeFantasia === 'clientes sem contrato'
  ) {
    throw new BadRequestError(
      'Esta empresa é estrutural do sistema e não pode ser excluída.',
    )
  }

  e.next()
}, 'companies')
