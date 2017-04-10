import {apiFetch} from './util'

export default function createDirectMessage(userName, msg) {
  return apiFetch('/api/im.open', {
    method: 'POST',
    user: userName,
  })
  .then(result => {
    return apiFetch('/api/chat.postMessage', {
      method: 'POST',
      channel: result.channelName,
      text: msg,
    })
  })
  .then(result => result.ok)
}
