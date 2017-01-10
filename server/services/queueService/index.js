import getBullQueue from 'bull'

import config from 'src/config'

export function getQueue(queueName) {
  return getBullQueue(queueName, config.server.redis.url)
}

export function emptyQueue(queueName) {
  return getQueue(queueName).empty()
}
