import config from 'src/config'
import {deprecatedCommand} from '../util'

export async function invoke() {
  const url = `${config.server.idm.baseURL}/profile`
  return deprecatedCommand('/profile', url)
}
