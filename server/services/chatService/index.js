import fetch from 'isomorphic-fetch'

import config from 'src/config'
import {createJob} from 'src/server/services/jobService'

if (!config.server.chat.baseURL) {
  throw new Error('Chat base URL must be set in config')
}

const paths = {
  channelCreate: () => '/api/lg/rooms',
  channelJoin: roomName => `/api/lg/rooms/${roomName}/join`,
  channelDelete: roomName => `/api/lg/rooms/${roomName}`,
  messageCreateChannel: roomName => `/api/lg/rooms/${roomName}/send`,
  messageCreateDirect: () => `/hooks/${config.server.chat.webhookTokens.DM}`,
}

const queues = {
  messageSent: 'chatMessageSent',
}

export function sendChannelMessage(channelName, message, options) {
  return _queueMessage('channel', channelName, message, options)
}

export function sendDirectMessage(userName, message, options) {
  return _queueMessage('direct', userName, message, options)
}

export function createDirectMessage(userName, message) {
  return _loginAndFetch(paths.messageCreateDirect(), {
    method: 'POST',
    body: JSON.stringify({channel: `@${userName}`, message})
  })
  .then(json => json.data || true)
}

export function createChannelMessage(channelName, msg) {
  return _loginAndFetch(paths.messageCreateChannel(channelName), {
    method: 'POST',
    body: JSON.stringify({msg})
  })
  .then(json => json.result)
}

export function createChannel(channelName, members = ['echo'], topic = '') {
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

export function joinChannel(channelName, members = []) {
  return _loginAndFetch(paths.channelJoin(channelName), {
    method: 'POST',
    body: JSON.stringify({
      members: members.concat('echo'),
    }),
  })
  .then(res => res.result)
}

export function deleteChannel(channelName) {
  return _loginAndFetch(paths.channelDelete(channelName), {
    method: 'DELETE',
  }).then(json => Boolean(json.result)) // return true on success
}

export function login() {
  if (!config.server.chat.userSecret) {
    throw new Error('Cannot log into chat: invalid user token')
  }
  return _fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `user=echo&password=${config.server.chat.userSecret}`,
  })
  .then(json => json.data)
}

function _loginAndFetch(path, options) {
  // TODO: cache these headers for a few seconds
  return login().then(r => {
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

function _queueMessage(type, target, message, options) {
  const payload = {type, target, msg: message}
  return createJob(queues.messageSent, payload, {
    attempts: config.server.chat.retries.message,
    backoff: {type: 'exponential'},
    ...options
  })
}
