import {apiFetch} from 'src/server/util/api'

export default function createDirectMessage(userName, msg) {
  return apiFetch('http://chat.learnersguild.test/api/im.open', {
    method: 'POST',
    token: '<09870987>',
    user: userName,
  })
  .then(result => {
    return apiFetch('http://chat.learnersguild.test/api/chat.postMessage', {
      method: 'POST',
      token: '<09870987>',
      channel: result.channelName,
      text: msg,
    })
  })
  .then(result => result.ok)
}
