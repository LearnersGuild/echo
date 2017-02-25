import {apiURL, apiFetch} from './util'

export default function createTeam(name, description, owner, repoNames, permission) {
  const qualifiedRepoNames = repoNames.map(repoName => `${owner}/${repoName}`)
  const createTeamURL = apiURL(`/orgs/${owner}/teams`)

  return apiFetch(createTeamURL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name,
      description,
      repo_names: qualifiedRepoNames, // eslint-disable-line camelcase
      permission,
    }),
  })
}
