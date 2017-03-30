import config from 'src/config'
import {apiFetch} from './util'

export default async function createChannel(channelName, members = [config.server.chat.userName], topic = '') {
  const result = await apiFetch('/api/channels.create', {
    method: 'POST',
    name: channelName
  })
  await apiFetch('/api/channels.setTopic', {
    method: 'POST',
    channel: channelName,
    topic
  })
  await Promise.all(members.map(
    member => apiFetch('/api/channels.invite', {
      method: 'POST',
      channel: channelName,
      user: member
    })
  ))

  return result
}
