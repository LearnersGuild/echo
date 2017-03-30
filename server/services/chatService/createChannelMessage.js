import config from 'src/config'
import {apiFetch} from './util'

export default function createChannelMessage(channelName, msg) {
  return apiFetch('/api/chat.postMessage', {
    method: 'POST',
    token: config.server.chat.token,
    channel: channelName,
    text: msg,
  })
  .then(result => result.channel)
}
