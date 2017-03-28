import {apiFetch} from 'src/server/util/api'

export default function joinChannel(userName) {
  return apiFetch('http://chat.learnersguild.test/api/channels.join', {
    method: 'POST',
    token: '<09870987>',
    user: userName,
  })
  .then(result => result.channel)
}
