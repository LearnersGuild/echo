import config from 'src/config'

const queues = {
  messageSent: 'chatMessageSent',
}

/**
 * NOTE: this service's functions are exported the way they are to enable
 * certain stubbing functionality functionality for testing that relies on the
 * way the module is cached and later required by dependent modules.
 */

export {default as createChannel} from './createChannel'
export {default as createChannelMessage} from './createChannelMessage'
export {default as createDirectMessage} from './createDirectMessage'
export {default as deleteChannel} from './deleteChannel'
export {default as joinChannel} from './joinChannel'

export function sendChannelMessage(channelName, message, options) {
  return _queueMessage('channel', channelName, message, options)
}

export function sendDirectMessage(userName, message, options) {
  return _queueMessage('user', userName, message, options)
}

function _queueMessage(type, target, message, options = {}) {
  const jobService = require('src/server/services/jobService')

  const payload = {type, target, msg: message}
  return jobService.createJob(queues.messageSent, payload, {
    attempts: config.server.chat.retries.message,
    backoff: {type: 'exponential'},
    ...options
  })
}
