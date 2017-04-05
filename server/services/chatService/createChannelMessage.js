import {apiFetch} from './util'

export default function createChannelMessage(channelName, msg) {
  return apiFetch('/api/chat.postMessage', {
    method: 'POST',
    body: {
      channel: channelName,
      text: msg,
      as_user: true, // eslint-disable-line camelcase
    },
  })
    .then(result => result.channel)
}
