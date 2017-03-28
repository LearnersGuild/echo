import fetch from 'isomorphic-fetch'

import {apiFetch} from 'src/server/util/api'
import config from 'src/config'

export default function createChannel(channelName, members = [config.server.chat.userName], topic = '') {
  return apiFetch('http://chat.learnersguild.test/api/channels.create', {
    method: 'POST',
    token: '<09870987>',
    name: channelName
  })
  .then(result => {
    apiFetch('http://chat.learnersguild.test/api/channels.setTopic', {
      method: 'POST',
      token: '<09870987>',
      channel: channelName,
      topic: topic
    })
    return result
    console.log('results?', result)
  })
  .then(result => {
    members.forEach(member => {
      apiFetch('http://chat.learnersguild.test/api/channels.invite', {
        method: 'POST',
        token: '<09870987>',
        channel: channelName,
        user: member
      })
    })
    return result
  })
  .then(result => result.channel)
}
