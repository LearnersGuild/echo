import {apiFetchAllPages} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default async function getCollaboratorsForRepo(owner, name) {
  const url = apiURL(`/repos/${owner}/${name}/collaborators`)
  return apiFetchAllPages(url, {headers: headers()})
}
