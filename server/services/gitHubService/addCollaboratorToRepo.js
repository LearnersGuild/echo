import {apiFetch} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default function addCollaboratorToRepo(username, owner, repo) {
  const addToTeamURL = apiURL(`/repos/${owner}/${repo}/collaborators/${username}`)
  return apiFetch(addToTeamURL, {method: 'PUT', headers: headers()})
    .then(() => true)
    .catch(err => {
      if (!_isUserAlreadyInvitedError(err)) {
        throw err
      }
    })
}

function _isUserAlreadyInvitedError(err) {
  return err.status === 422 &&
    err.errObj.message.match(/validation\s+failed/i) &&
    err.errObj.errors.length > 0 &&
    err.errObj.errors[0].message.match(/user.*already.*invited/i)
}
