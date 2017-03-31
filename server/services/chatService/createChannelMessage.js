import {apiFetch} from 'src/server/util/api'

export default function createChannelMessage(channelName, msg) {
  return apiFetch('http://chat.learnersguild.test/api/chat.postMessage', {
    method: 'POST',
    token: '<09870987>',
    channel: channelName,
    text: msg,
  })
  .then(result => result.channel)
}
