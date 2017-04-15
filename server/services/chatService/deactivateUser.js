import {apiFetch} from 'src/server/util/api'
import {scimApiURL, headers} from './util'

export default function deactivateUser(userId) {
  const removeFromOrganizationURL = scimApiURL(`/Users/${userId}`)
  return apiFetch(removeFromOrganizationURL, {method: 'DELETE', headers: headers()})
    .then(() => true)
}
