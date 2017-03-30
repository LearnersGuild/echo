import config from 'src/config'
import {apiFetch} from './util'

export default function createDirectMessage(userName, msg) {
  return apiFetch('/api/im.open', {
    method: 'POST',
    token: config.server.chat.token,
    user: userName,
  })
  .then(result => {
    return apiFetch('/api/chat.postMessage', {
      method: 'POST',
      token: config.server.chat.token,
      channel: result.channelName,
      text: msg,
    })
  })
  .then(result => result.ok)
}
