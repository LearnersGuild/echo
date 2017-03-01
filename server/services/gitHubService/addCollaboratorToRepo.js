import {apiFetch} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default function addCollaboratorToRepo(username, owner, repo) {
  const addToTeamURL = apiURL(`/repos/${owner}/${repo}/collaborators/${username}`)
  return apiFetch(addToTeamURL, {method: 'PUT', headers: headers()})
    .then(() => true)
}
