import config from 'src/config'
import {deprecatedCommand} from '../util'

export async function invoke(args) {
  let url = `${config.app.baseURL}/retro`
  if (args._.length >= 1) {
    const [projectName] = args._
    url += `/${projectName}`
  }

  return deprecatedCommand('/retro', url)
}
