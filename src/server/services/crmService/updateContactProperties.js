import {default as fetchCRM} from './util'
import {default as getContactByEmail} from './getContactByEmail'

export default async function updateContactProperties(email, properties) {
  const contact = await getContactByEmail(email)

  await fetchCRM(`/contacts/v1/contact/vid/${contact.vid}/profile`, {
    method: 'POST',
    body: JSON.stringify({properties})
  })

  // API returns statusCode 204 with no body
  return true
}
