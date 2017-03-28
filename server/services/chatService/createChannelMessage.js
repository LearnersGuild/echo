import fetch from 'isomorphic-fetch'

import {apiFetch} from 'src/server/util/api'
import config from 'src/config'

export default function createChannelMessage(channelName, msg) {
  return apiFetch('http://chat.learnersguild.test/api/chat.postMessage', {
    method: 'POST',
    token: '<09870987>',
    channel: channelName,
    text: msg,
  })
  .then(result => result.channel)
}
