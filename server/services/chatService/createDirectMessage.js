import {apiFetch} from './util'

export default async function createDirectMessage(userName, msg) {
  return apiFetch('/api/im.open', {
    method: 'POST',
    user: userName,
  })
    .then(result => {
      return apiFetch('/api/chat.postMessage', {
        method: 'POST',
        body: {
          channel: result.channelName,
          text: msg,
          as_user: true, // eslint-disable-line camelcase
        },
      })
    })
    .then(result => result.ok)
}
