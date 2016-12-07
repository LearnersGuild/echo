import fetch from 'isomorphic-fetch'

import config from 'src/config'

const chatBaseUrl = config.server.chat.baseURL
const chatUserSecret = config.server.chat.userSecret
const chatWebhookTokenDM = config.server.chat.webhookTokens.DM
if (!chatBaseUrl) {
  throw new Error('Chat base URL must be set in config')
}

export default class ChatClient {
  login() {
    if (!chatUserSecret) {
      throw new Error('Cannot log into chat: invalid user token')
    }
    return this._fetchFromChat('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `user=echo&password=${chatUserSecret}`,
    })
    .then(json => json.data)
  }

  sendDirectMessage(userName, msg) {
    return this._loginAndFetchFromChat(`/hooks/${chatWebhookTokenDM}`, {
      method: 'POST',
      body: JSON.stringify({channel: `@${userName}`, msg})
    })
    .then(json => json.data)
  }

  sendChannelMessage(channel, msg) {
    return this._loginAndFetchFromChat(`/api/lg/rooms/${channel}/send`, {
      method: 'POST',
      body: JSON.stringify({msg})
    })
    .then(json => json.result)
  }

  createChannel(channelName, members = ['echo'], topic = '') {
    return this._loginAndFetchFromChat('/api/lg/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: channelName,
        members,
        topic,
      })
    })
    .then(result => result.room)
  }

  joinChannel(channelName, members = []) {
    return this._loginAndFetchFromChat(`/api/lg/rooms/${channelName}/join`, {
      method: 'POST',
      body: JSON.stringify({
        members: members.concat('echo'),
      }),
    })
    .then(res => res.result)
  }

  deleteChannel(channelName) {
    return this._loginAndFetchFromChat(`/api/lg/rooms/${channelName}`, {
      method: 'DELETE',
    }).then(json => Boolean(json.result)) // return true on success
  }

  _fetchFromChat(path, options) {
    const url = `${chatBaseUrl}${path}`
    return fetch(url, options)
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

  _loginAndFetchFromChat(path, options) {
    return this.authHeaders()
      .then(authHeaders => {
        const headers = Object.assign({}, authHeaders, {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        })
        const optionsWithHeaders = Object.assign({}, options, {headers})
        return this._fetchFromChat(path, optionsWithHeaders)
      })
  }

  authHeaders() {
    // TODO: cache these headers for a few seconds
    return this.login().then(r => {
      return {
        'X-User-Id': r.userId,
        'X-Auth-Token': r.authToken,
      }
    })
  }
}
