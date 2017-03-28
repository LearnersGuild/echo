import fetch from 'isomorphic-fetch'

import {apiFetch} from 'src/server/util/api'
import config from 'src/config'

export default function deleteChannel() {

  return fetch(`/api/lg/rooms/${channelName}`, {
    method: 'DELETE',
  }).then(json => Boolean(json.result)) // return true on success

}
