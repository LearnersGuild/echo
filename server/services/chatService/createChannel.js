import config from 'src/config'
import {apiURL, apiFetch} from './util'

export default async function createChannel(channelName, members = [config.server.chat.userName], topic = '') {
  const addToChannelURL = apiURL()
  const result = await apiFetch(addToChannelURL, {
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
