import {apiFetch} from './util'

export default function createMultiPartyDirectMessage(users, msg) {
  return apiFetch('/api/mpim.open', {
    method: 'POST',
    body: {
      users: users.join(',')
    }
  })
    .then(result => {
      return apiFetch('/api/chat.postMessage', {
        method: 'POST',
        body: {
          channel: result.group.id,
          text: msg,
          as_user: true, // eslint-disable-line camelcase
        },
      })
    })
    .then(result => result.ok)
}
