import {apiFetch} from './util'

export default function deleteChannel(channelName) {
  return apiFetch('/api/channels.archive', {
    method: 'POST',
    body: {channel: channelName},
  })
    .then(result => result.ok)
}
