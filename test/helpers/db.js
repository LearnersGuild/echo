import r from '../../db/connect'

async function truncateDBTables() {
  try {
    // const start = new Date().getTime()
    const tables = await r.tableList()
    const tablesToTruncate = tables.filter(t => !t.startsWith('_'))
    await Promise.all(tablesToTruncate.map(async t => {
      try {
        // const tableStart = new Date().getTime()
        await r.table(t).delete()
        // const tableEnd = new Date().getTime()
        // console.log(`truncated ${t} in ${tableEnd - tableStart} ms`)
      } catch (e) {
        throw (e)
      }
    }))
    // const now = new Date().getTime()
    // console.log(`truncated all tables in ${now - start} ms`)
  } catch (e) {
    throw (e)
  }
}

/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback */
export function withDBCleanup() {
  beforeEach(function () {
    this.timeout(21000)
    return truncateDBTables()
  })
}
