import r from '../../db/connect'

async function truncateDBTables() {
  const start = new Date().getTime()
  const tables = await r.tableList()
  const tablesToTruncate = tables.filter(t => !t.startsWith('_'))
  await Promise.all(tablesToTruncate.map(async t => {
    try {
      const tableStart = new Date().getTime()
      await r.table(t).delete()
      const tableEnd = new Date().getTime()
      console.log(`truncated ${t} in ${tableEnd - tableStart} ms`)
    } catch (e) {
      throw (e)
    }
  }))
  const now = new Date().getTime()
  console.log(`truncated all tables in ${now - start} ms`)
}

/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback */
export function withDBCleanup() {
  beforeEach(function () {
    // this.timeout(10000)
    return truncateDBTables()
  })
}
