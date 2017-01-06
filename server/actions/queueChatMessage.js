import {getQueue} from 'src/server/util/queue'

const QUEUE = getQueue('sendChatMessage')

export default function queueChatMessage({type, target, msg}, overrideOptions = {}) {
  const jobOpts = {
    attempts: 5,
    backoff: {type: 'exponential', delay: 1000},
    ...overrideOptions
  }
  return QUEUE.add({type, target, msg}, jobOpts)
}
