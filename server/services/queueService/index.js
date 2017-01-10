import getBullQueue from 'bull'

import config from 'src/config'

/**
 * NOTE: this service's functions are exported the way they are to enable
 * certain stubbing functionality functionality for testing that relies on the
 * way the module is cached and later required by dependent modules.
 */
export default {
  getQueue,
  emptyQueue,
}

function getQueue(queueName) {
  return getBullQueue(queueName, config.server.redis.url)
}

function emptyQueue(queueName) {
  return getQueue(queueName).empty()
}
