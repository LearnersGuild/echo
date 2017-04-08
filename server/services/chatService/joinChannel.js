import {apiFetch} from './util'

export default function joinChannel(userName) {
  return apiFetch('/api/channels.join', {
    method: 'POST',
    body: {user: userName},
  })
    .then(result => result.channel)
}
