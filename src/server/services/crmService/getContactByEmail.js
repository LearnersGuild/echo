import {default as fetchCRM} from './util'

export default async function getContactByEmail(email) {
  return fetchCRM(`/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`)
}
