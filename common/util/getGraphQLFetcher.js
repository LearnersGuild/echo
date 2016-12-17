/* global __SERVER__ */
import fetch from 'isomorphic-fetch'

import {updateJWT} from 'src/common/actions/auth'

let APP_BASE_URL = ''
if (__SERVER__) {
  APP_BASE_URL = require('src/config').server.baseURL
}

export default function getGraphQLFetcher(dispatch, auth, baseUrl = APP_BASE_URL, throwErrors = true) {
  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphQLParams),
    }
    if (auth.lgJWT) {
      options.headers = Object.assign(options.headers, {
        Authorization: `Bearer ${auth.lgJWT}`,
      })
    }

    return fetch(`${baseUrl}/graphql`, options)
      .then(resp => {
        if (!resp.ok) {
          return resp.json().then(errorResponse => {
            throw errorResponse
          })
        }

        // for sliding-sessions, update our JWT from the LearnersGuild-JWT header
        const lgJWT = resp.headers.get('LearnersGuild-JWT')
        if (lgJWT) {
          dispatch(updateJWT(lgJWT))
        }

        return resp.json()
      })
      .then(graphQLResponse => {
        if (graphQLResponse.errors) {
          throw graphQLResponse
        }

        return graphQLResponse
      })
      .catch(err => {
        if (err && err.errors && err.errors.length > 0) {
          if (throwErrors) {
            throw new Error(err.errors[0].message)
          }
        }
        console.error('GraphQL ERROR:', err)
      })
  }
}
