// Hook executed before creating a ticket to ensure sequential ticket number
onRecordCreate((e) => {
  const currentNum = e.record.getString('numero')
  if (!currentNum || currentNum === '' || currentNum === 'AUTO') {
    let nextSeq = 1001
    try {
      const records = $app.findRecordsByFilter('tickets', "numero != ''", '-numero', 1, 0)
      if (records.length > 0) {
        const topNum = records[0].getString('numero').replace('#', '').trim()
        const parsed = parseInt(topNum, 10)
        if (!isNaN(parsed) && parsed >= 1000) {
          nextSeq = parsed + 1
        }
      }
    } catch (_) {}
    e.record.set('numero', '#' + nextSeq)
  }

  if (!e.record.getString('opened_at')) {
    e.record.set('opened_at', new Date().toISOString())
  }

  e.next()
}, 'tickets')
