import {apiFetch} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default function addUserToTeam(username, teamId) {
  const addToTeamURL = apiURL(`/teams/${teamId}/memberships/${username}`)
  return apiFetch(addToTeamURL, {method: 'PUT', headers: headers()})
}
