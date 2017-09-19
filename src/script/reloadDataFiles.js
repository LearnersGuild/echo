/* eslint-disable xo/no-process-exit */
import reloadDefaultModelData from 'src/server/actions/reloadDefaultModelData'
import finish from './util'

console.log('Reloading Data Files')

reloadDefaultModelData()
  .then(() => finish())
  .catch(finish)
