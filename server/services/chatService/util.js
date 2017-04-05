import formEncode from 'form-urlencoded'

import config from 'src/config'
import {apiFetch as utilApiFetch, APIError} from 'src/server/util/api'

export function apiURL(path) {
  return `${config.server.chat.baseURL}${path}`
}

export function headers(additional = {}) {
  const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  return {...defaultHeaders, ...additional}
}

export function apiFetch(path, options = {}) {
  const url = apiURL(path)
  const body = formEncode({
    ...options.body,
    token: config.server.chat.token,
  })
  const allHeaders = headers(options.headers)
  const allOptions = {
    ...options,
    headers: allHeaders,
    body,
  }
  return utilApiFetch(apiURL(path), allOptions)
    .then(result => {
      if (!result.ok) {
        console.error({result})
        throw new APIError(500, result.error, url, result)
      }
      return result
    })
}
