import config from 'src/config'

export function apiURL(path) {
  return `${config.server.heroku.baseURL}${path}`
}

export function headers(additional = {}) {
  const defaultHeaders = {
    Authorization: `Bearer ${config.server.heroku.apiToken}`,
    Accept: 'application/vnd.heroku+json; version=3',
  }
  return {...defaultHeaders, ...additional}
}
