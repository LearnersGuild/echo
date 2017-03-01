import config from 'src/config'

export function apiURL(path) {
  return `${config.server.github.baseURL}${path}`
}

export function headers(additional = {}) {
  const defaultHeaders = {
    Authorization: `token ${config.server.github.tokens.admin}`,
    Accept: 'application/vnd.github.v3+json',
  }
  return {...defaultHeaders, ...additional}
}
