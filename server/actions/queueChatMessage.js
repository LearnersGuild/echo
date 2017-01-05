import {getQueue} from 'src/server/util/queue'

const QUEUE = getQueue('sendChatMessage')

export default function queueChatMessage({type, target, msg}) {
  const jobOpts = {
    attempts: 5,
    backoff: {type: 'exponential', delay: 1000},
  }
  return QUEUE.add({type, target, msg}, jobOpts)
}
