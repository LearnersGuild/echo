import fetch from 'isomorphic-fetch'
import parseLinkHeader from 'parse-link-header'
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

export class APIError extends Error {
  constructor(status, statusText, url) {
    const message = `API Error ${status} (${statusText}) trying to invoke API (url = '${url}')`
    super(message)
    this.name = 'APIError'
    this.status = status
    this.statusText = statusText
    this.url = url
  }
}

export function apiFetchRaw(url, opts = {}) {
  const options = {...opts, headers: headers(opts.headers)}
  return fetch(url, options)
}

export function apiFetch(url, opts = {}) {
  return apiFetchRaw(url, opts)
    .then(resp => {
      if (!resp.ok) {
        throw new APIError(resp.status, resp.statusText, url)
      }
      return resp.json()
    })
}

export function apiFetchAllPages(url, opts = {}, prevResults = []) {
  return apiFetchRaw(url, opts)
    .then(resp => {
      if (!resp.ok) {
        throw new APIError(resp.status, resp.statusText, url)
      }
      const link = parseLinkHeader(resp.headers.get('Link'))
      let next = null
      if (link && link.next) {
        next = link.next.results && !eval(link.next.results) ? null : link.next.url // eslint-disable-line no-eval
      }
      return resp.json()
        .then(results => {
          if (next) {
            return apiFetchAllPages(next, opts, prevResults.concat(results))
          }
          return prevResults.concat(results)
        })
    })
}
