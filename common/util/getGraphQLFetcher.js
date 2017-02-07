/* global __SERVER__ */
import fetch from 'isomorphic-fetch'

import {updateJWT, unauthenticatedError} from 'src/common/actions/auth'
import {fetchDataRequest, fetchDataSuccess, fetchDataFailure} from 'src/common/actions/app'
import handleGraphQLError from 'src/common/util/handleGraphQLError'

let APP_BASE_URL = ''
if (__SERVER__) {
  APP_BASE_URL = require('src/config').server.baseURL
}

export default function getGraphQLFetcher(dispatch, auth, baseUrl = APP_BASE_URL, throwErrors = true) {
  dispatch(fetchDataRequest())

  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
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
          if (resp.status === 401) {
            dispatch(unauthenticatedError())
          }
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
          dispatch(fetchDataFailure(graphQLResponse.errors[0].message))
          throw graphQLResponse
        }

        dispatch(fetchDataSuccess())
        return graphQLResponse
      })
      .catch(err => handleGraphQLError(err, {throwErrors}))
  }
}
