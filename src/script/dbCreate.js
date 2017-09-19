import {createDb} from 'src/server/services/dataService'
import finish from './util'

createDb()
  .then(() => finish())
  .catch(finish)
