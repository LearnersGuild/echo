import r from '../../db/connect'

export function truncateDBTables() {
  this.timeout(30000)  // for some reason, truncating tables can sometimes take a long time
  return r.tableList()
    .then(tables => tables.filter(t => !t.startsWith('_')))
    .then(tablesToTruncate => Promise.all(tablesToTruncate.map(t => r.table(t).delete().run())))
    .then(() => {
      // this.timeout(2000)  // reset to default timeout
    })
}

/* eslint-env mocha */
export function withDBCleanup() {
  beforeEach(truncateDBTables)
}
