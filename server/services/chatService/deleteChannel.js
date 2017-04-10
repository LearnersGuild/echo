import {apiFetch} from './util'

export default function deleteChannel(channelName) {
  return apiFetch('/api/channels.archive', {
    method: 'POST',
    channel: channelName
  })
  .then(result => result.ok)
}
