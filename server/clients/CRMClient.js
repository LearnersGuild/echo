import fetch from 'isomorphic-fetch'

import config from 'src/config'

const crmBaseUrl = config.server.crm.baseURL
const crmKey = config.server.crm.key

function _assertEnvironment() {
  if (!crmBaseUrl) {
    throw new Error('CRM base URL must be configured')
  }
  if (!crmKey) {
    throw new Error('CRM API key must be configured')
  }
}

function crmURL(path) {
  _assertEnvironment()
  return `${crmBaseUrl}${path}?hapikey=${crmKey}`
}

export function getContactByEmail(email) {
  const encodedEmail = encodeURIComponent(email)
  return fetch(crmURL(`/contacts/v1/contact/email/${encodedEmail}/profile`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    }
  }).then(resp => {
    if (!resp.ok) {
      throw new Error(`Couldn't get contact by email: ${resp.statusText}`)
    }
    return resp.json()
  })
}

const playerSignedUpBody = JSON.stringify({
  properties: [{
    property: 'signed_up_for_echo',
    value: true,
  }]
})

export function notifyContactSignedUp(email) {
  return getContactByEmail(email)
    .then(contact => {
      return fetch(crmURL(`/contacts/v1/contact/vid/${contact.vid}/profile`), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application.json'
        },
        body: playerSignedUpBody,
      }).then(resp => {
        if (!resp.ok) {
          throw new Error(`Couldn't notify that contact signed up: ${resp.statusText}`)
        }
        // API returns statusCode 204 with no body
        return true
      })
    })
}
