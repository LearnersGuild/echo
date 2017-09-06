import {truncateTables} from 'src/server/services/dataService'

export default function resetDB() {
  // truncating tables can sometimes take a long time
  // see: https://github.com/rethinkdb/rethinkdb/issues/134
  this.timeout(30000)
  return truncateTables()
}
