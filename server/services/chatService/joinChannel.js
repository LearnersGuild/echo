import {apiFetch} from './util'

export default function joinChannel(userName) {
  return apiFetch('/api/channels.join', {
    method: 'POST',
    user: userName,
  })
  .then(result => result.channel)
}
