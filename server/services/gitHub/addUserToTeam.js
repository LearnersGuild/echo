import {apiURL, apiFetch} from './util'

export default function addUserToTeam(username, teamId) {
  const addToTeamURL = apiURL(`/teams/${teamId}/memberships/${username}`)
  return apiFetch(addToTeamURL, {method: 'PUT'})
}
