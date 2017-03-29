import config from 'src/config'
import {apiFetch as utilApiFetch} from 'src/server/util/api'

export function apiURL(path) {
  return `${config.server.chat.baseURL}${path}`
}

export function headers(additional = {}) {
  const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  return {...defaultHeaders, ...additional}
}

export function apiFetch(url, options) {
  const allHeaders = headers(options.headers)
  return utilApiFetch(url, {
    ...options,
    token: '<09870987>',
    headers: allHeaders,
  })
}
