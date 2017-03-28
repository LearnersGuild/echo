import fetch from 'isomorphic-fetch'

import {apiFetch} from 'src/server/util/api'
import config from 'src/config'

export default function createChannel(channelName, members = [config.server.chat.userName], topic = '') {

  apiFetch('/api/channels.create', {
    method: 'POST',
    token: '<09870987>',
    name: channelName
  })
  .then(() => {
    apiFetch('/api/channels.setTopic', {
      method: 'POST',
      token: '<09870987>',
      channel: channelName,
      topic: topic
    })
  })
  .then(() => {
    members.forEach(member => {
      apiFetch('/api/channels.invite', {
        method: 'POST',
        token: '<09870987>',
        channel: channelName,
        user: member
      })
    })
  })
  .then(() => channelName)
}
