import {apiURL, apiFetchAllPages} from './util'

export default async function getTeam(owner, name) {
  const getTeamsURL = apiURL(`/orgs/${owner}/teams`)

  return apiFetchAllPages(getTeamsURL)
    .then(teams => teams.filter(team => team.name === name)[0] || null)
}
