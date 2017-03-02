import fetch from 'isomorphic-fetch'
import parseLinkHeader from 'parse-link-header'

export class APIError extends Error {
  constructor(status, statusText, url, errObj = {}) {
    const message = `API Error ${status} (${statusText}) trying to invoke API (url = '${url}')`
    super(message)
    this.name = 'APIError'
    this.status = status
    this.statusText = statusText
    this.url = url
    this.errObj = errObj
  }
}

export function apiFetchRaw(url, opts = {}) {
  return fetch(url, opts)
}

export function apiFetch(url, opts = {}) {
  return apiFetchRaw(url, opts)
    .then(resp => {
      return resp.json().then(result => {
        if (!resp.ok) {
          throw new APIError(resp.status, resp.statusText, url, result)
        }
        return result
      })
    })
}

export function apiFetchAllPages(url, opts = {}, prevResults = []) {
  return apiFetchRaw(url, opts)
    .then(resp => {
      return resp.json().then(results => {
        if (!resp.ok) {
          throw new APIError(resp.status, resp.statusText, url, results)
        }

        const link = parseLinkHeader(resp.headers.get('Link'))
        let next = null
        if (link && link.next) {
          next = link.next.results && !eval(link.next.results) ? null : link.next.url // eslint-disable-line no-eval
        }
        if (next) {
          return apiFetchAllPages(next, opts, prevResults.concat(results))
        }
        return prevResults.concat(results)
      })
    })
}
