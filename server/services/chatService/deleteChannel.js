import config from 'src/config'
import {apiFetch} from './util'

export default function deleteChannel(channelName) {
  return apiFetch('/api/channels.archive', {
    method: 'POST',
    token: config.server.chat.token,
    channel: channelName
  })
  .then(result => result.ok)
}
