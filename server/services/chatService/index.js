import config from 'src/config'

import {default as createChannel} from './createChannel'
import {default as createChannelMessage} from './createChannelMessage'
import {default as createDirectMessage} from './createDirectMessage'
import {default as createMultiPartyDirectMessage} from './createMultiPartyDirectMessage'
import {default as createResponseMessage} from './createResponseMessage'
import {default as deactivateUser} from './deactivateUser'
import {default as deleteChannel} from './deleteChannel'
import {default as getChannelList} from './getChannelList'
import {default as getUserList} from './getUserList'
import {default as inviteToChannel} from './inviteToChannel'

const queues = {
  messageSent: 'chatMessageSent',
}

function sendChannelMessage(channelName, message, options) {
  return _queueMessage('channel', channelName, message, options)
}

function sendDirectMessage(userName, message, options) {
  return _queueMessage('user', userName, message, options)
}

function sendMultiPartyDirectMessage(users, message, options) {
  return _queueMessage('group', users, message, options)
}

function sendResponseMessage(responseURL, response, options) {
  return _queueMessage('response', responseURL, response, options)
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
  createMultiPartyDirectMessage,
  createResponseMessage,
  deactivateUser,
  deleteChannel,
  getChannelList,
  getUserList,
  inviteToChannel,
  sendChannelMessage,
  sendDirectMessage,
  sendMultiPartyDirectMessage,
  sendResponseMessage,
}
