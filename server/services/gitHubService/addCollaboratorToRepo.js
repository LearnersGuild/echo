import {apiURL, apiFetch} from './util'

export default function addCollaboratorToRepo(username, owner, repo) {
  const addToTeamURL = apiURL(`/repos/${owner}/${repo}/collaborators/${username}`)
  return apiFetch(addToTeamURL, {method: 'PUT'})
    .then(() => true)
}
