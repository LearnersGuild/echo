import {roundDecimal} from 'src/common/util'

const BLANK = '--'
const DEFAULT_SUFFIX = ''

export default function getStatRenderer(stats) {
  return (name, suffix = DEFAULT_SUFFIX) => {
    const statValue = Number.isFinite(stats[name]) ? roundDecimal(stats[name]) : BLANK
    const suffixValue = statValue !== BLANK ? suffix : DEFAULT_SUFFIX
    return `${statValue}${suffixValue}`
  }
}
