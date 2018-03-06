import fetch from 'isomorphic-fetch'

import config from 'src/config'

export default async function fetchCRM(path, fetchOptions = {}) {
  const url = _crmURL(path)

  const options = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    ...fetchOptions
  }

  const resp = await fetch(url, options)

  if (!resp.ok) {
    throw new Error(`Couldn't fetch from CRM service: ${resp.statusText}`)
  }

  return resp.json()
}

function _crmURL(path) {
  _assertEnvironment()
  return `${config.server.crm.baseURL}${path}?hapikey=${config.server.crm.key}`
}

function _assertEnvironment() {
  if (!config.server.crm.baseURL) {
    throw new Error('CRM base URL must be configured')
  }
  if (!config.server.crm.key) {
    throw new Error('CRM API key must be configured')
  }
}
