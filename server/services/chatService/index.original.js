import fetch from 'isomorphic-fetch'

import config from 'src/config'

if (!config.server.chat.baseURL) {
  throw new Error('Chat base URL must be set in config')
}

const queues = {
  messageSent: 'chatMessageSent',
}

const paths = {
  login: '/api/login',
  channelCreate: () => '/api/lg/rooms',
  channelJoin: roomName => `/api/lg/rooms/${roomName}/join`,
  channelDelete: roomName => `/api/lg/rooms/${roomName}`,
  messageCreateChannel: roomName => `/api/lg/rooms/${roomName}/send`,
  messageCreateDirect: () => `/hooks/${config.server.chat.webhookTokens.DM}`,
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
  sendDirectMessage,
}

function createChannel(channelName, members = [config.server.chat.userName], topic = '') {
  return _loginAndFetch(paths.channelCreate(), {
    method: 'POST',
    body: JSON.stringify({
      name: channelName,
      members,
      topic,
    })
  })
  .then(result => result.room)
}

function createChannelMessage(channelName, msg) {
  return _loginAndFetch(paths.messageCreateChannel(channelName), {
    method: 'POST',
    body: JSON.stringify({msg})
  })
  .then(json => json.result)
}

function createDirectMessage(userName, msg) {
  return _loginAndFetch(paths.messageCreateDirect(), {
    method: 'POST',
    body: JSON.stringify({channel: `@${userName}`, msg})
  })
  .then(json => json.data)
}

function deleteChannel(channelName) {
  return _loginAndFetch(paths.channelDelete(channelName), {
    method: 'DELETE',
  }).then(json => Boolean(json.result)) // return true on success
}

function joinChannel(channelName, members = []) {
  return _loginAndFetch(paths.channelJoin(channelName), {
    method: 'POST',
    body: JSON.stringify({
      members: members.concat(config.server.chat.userName),
    }),
  })
  .then(res => res.result)
}

function sendChannelMessage(channelName, message, options) {
  return _queueMessage('channel', channelName, message, options)
}

function sendDirectMessage(userName, message, options) {
  return _queueMessage('user', userName, message, options)
}

function _fetch(path, options) {
  return fetch(`${config.server.chat.baseURL}${path}`, options)
    .then(resp => {
      return resp.json().catch(err => {
        console.error('Chat response parse error:', err)
        return Promise.reject(new Error('There was a problem fetching data from the chat service'))
      })
    })
    .then(json => {
      if (json.status !== 'success' && json.success !== true) {
        return Promise.reject(new Error(json.message))
      }
      return json
    })
}

function _loginAndFetch(path, options) {
  return _login().then(r => {
    const authHeaders = {
      'X-User-Id': r.userId,
      'X-Auth-Token': r.authToken,
    }
    const headers = Object.assign({}, authHeaders, {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    })
    const optionsWithHeaders = Object.assign({}, options, {headers})
    return _fetch(path, optionsWithHeaders)
  })
}

function _login() {
  if (!config.server.chat.userSecret) {
    throw new Error('Cannot log into chat: invalid user token')
  }
  return _fetch(paths.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `user=${config.server.chat.userName}&password=${config.server.chat.userSecret}`,
  })
  .then(json => json.data)
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
