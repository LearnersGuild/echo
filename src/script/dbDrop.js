import {dropDb} from 'src/server/services/dataService'
import finish from './util'

dropDb()
  .then(() => finish())
  .catch(finish)
