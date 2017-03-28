import fetch from 'isomorphic-fetch'

import {apiFetch} from 'src/server/util/api'
import config from 'src/config'

export default function joinChannel(userName) {
  return apiFetch('http://chat.learnersguild.test/api/channels.join', {
    method: 'POST',
    token: '<09870987>',
    user: userName,
  })
  .then(result => {
    apiFetch('http://chat.learnersguild.test/api/channels.invite', {
      method: 'POST',
      token: '<09870987>',
      channel: channelName,
      user: member
    })
    return result
  })
  .then(result => result.channel)
}
