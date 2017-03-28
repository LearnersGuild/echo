import fetch from 'isomorphic-fetch'

import {apiFetch} from 'src/server/util/api'
import config from 'src/config'

export default function createChannel() {
  .catch(err => {
    if (!_isUserAlreadyInvitedError(err)) {
      throw err
    }
  })
}
