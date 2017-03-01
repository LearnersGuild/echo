import {apiFetch} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default function createTeam(name, description, owner, options = {}) {
  const createTeamURL = apiURL(`/orgs/${owner}/teams`)
  const body = {name, description}
  if (options.repoNames) {
    const qualifiedRepoNames = options.repoNames.map(repoName => `${owner}/${repoName}`)
    body.repo_names = qualifiedRepoNames // eslint-disable-line camelcase
  }
  if (options.permission) {
    body.permission = options.permission
  }

  return apiFetch(createTeamURL, {
    method: 'POST',
    headers: headers({'Content-Type': 'application/json'}),
    body: JSON.stringify(body),
  })
}
