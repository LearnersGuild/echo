import {apiFetchAllPages} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default async function getTeam(owner, name) {
  const getTeamsURL = apiURL(`/orgs/${owner}/teams`)

  return apiFetchAllPages(getTeamsURL, {headers: headers()})
    .then(teams => teams.filter(team => team.name === name)[0] || null)
}
