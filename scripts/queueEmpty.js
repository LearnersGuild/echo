/* eslint-disable import/imports-first */
import parseArgs from 'minimist'

import {emptyQueue} from 'src/server/services/queueService'
import {finish} from './util'

run()
  .then(() => finish())
  .catch(finish)

function run() {
  const {QUEUE_NAME} = _parseCLIArgs(process.argv.slice(2))
  console.log(`Emptying queue ${QUEUE_NAME}`)
  return emptyQueue(QUEUE_NAME)
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  if (args._.length !== 1) {
    throw new Error('Usage: npm run queue:empty -- QUEUE_NAME')
  }
  const [QUEUE_NAME] = args._
  return {QUEUE_NAME}
}
