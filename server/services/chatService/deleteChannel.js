import {apiFetch} from 'src/server/util/api'

export default function deleteChannel(channelName) {
  return apiFetch('http://chat.learnersguild.test/api/channels.archive', {
    method: 'POST',
    token: '<09870987>',
    channel: channelName
  })
  .then(result => result.ok)
}
