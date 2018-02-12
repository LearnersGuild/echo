import {truncateTables} from 'src/server/services/dataService'
import reloadDefaultModelData from 'src/server/actions/reloadDefaultModelData'

export async function resetDB() {
  // truncating tables can sometimes take a long time
  // see: https://github.com/rethinkdb/rethinkdb/issues/134
  this.timeout(30000)
  await truncateTables()
  await reloadDefaultModelData()
}
