import config from 'src/config'

import {default as createChannel} from './createChannel'
import {default as createChannelMessage} from './createChannelMessage'
import {default as createDirectMessage} from './createDirectMessage'
import {default as deleteChannel} from './deleteChannel'
import {default as joinChannel} from './joinChannel'

const queues = {
  messageSent: 'chatMessageSent',
}

function sendChannelMessage(channelName, message, options) {
  return _queueMessage('channel', channelName, message, options)
}

function sendDirectMessage(userName, message, options) {
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

/**
* NOTE: this service's functions are exported the way they are to enable
* certain stubbing functionality functionality for testing that relies on the
* way the module is cached and later required by dependent modules.
*/

export default {
  createChannel,
  createChannelMessage,
  createDirectMessage,
  deleteChannel,
  joinChannel,
  sendChannelMessage,
  sendDirectMessage
}
