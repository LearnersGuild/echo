import {apiFetchAllPages} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default function getCollaboratorsForApp(app) {
  const addToAppURL = apiURL(`/apps/${app}/collaborators`)
  return apiFetchAllPages(addToAppURL, {headers: headers()})
}
