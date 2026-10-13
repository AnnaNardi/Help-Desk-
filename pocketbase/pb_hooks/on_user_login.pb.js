// Request hook on user auth to log logins in activity_logs
onRecordAuthRequest((e) => {
  e.next()

  try {
    if (e.record) {
      const logCol = $app.findCollectionByNameOrId('activity_logs')
      const logRec = new Record(logCol)
      logRec.set('user', e.record.id)
      logRec.set('action', 'login')
      logRec.set('entity_type', 'user')
      logRec.set('entity_id', e.record.id)
      logRec.set('details', { email: e.record.email() })
      $app.save(logRec)
    }
  } catch (err) {
    console.log('Error logging auth request:', err)
  }
}, '_pb_users_auth_')
