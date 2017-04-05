import fetch from 'isomorphic-fetch'

export default function createResponseMessage(responseURL, response) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  const body = JSON.stringify(response)
  return fetch(responseURL, {
    method: 'POST',
    headers,
    body,
  })
    .then(result => result.ok)
}
