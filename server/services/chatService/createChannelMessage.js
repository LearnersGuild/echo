import {apiFetch} from './util'

export default function createChannelMessage(channelName, msg) {
  return apiFetch('/api/chat.postMessage', {
    method: 'POST',
    channel: channelName,
    text: msg,
  })
  .then(result => result.channel)
}
