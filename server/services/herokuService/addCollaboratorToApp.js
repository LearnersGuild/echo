import {apiFetch} from 'src/server/util/api'

import {apiURL, headers} from './util'

export default function addCollaboratorToApp(user, app) {
  const addToAppURL = apiURL(`/apps/${app}/collaborators`)

  return apiFetch(addToAppURL, {
    method: 'POST',
    headers: headers({'Content-Type': 'application/json'}),
    body: JSON.stringify({user}),
  })
    .then(() => true)
}
