import Models from 'src/server/services/dataService'

const {truncateTables} = Models

export function resetDB() {
  // truncating tables can sometimes take a long time
  // see: https://github.com/rethinkdb/rethinkdb/issues/134
  this.timeout(30000)
  return truncateTables()
}
