import config from 'src/config'
import {deprecatedCommand} from '../util'

export async function invoke(args) {
  let url = config.app.playbookURL
  if (args._.length >= 1) {
    const [search] = args._
    url += `?q=${search}`
  }

  return deprecatedCommand('/playbook', url)
}
