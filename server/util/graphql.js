import fetch from 'isomorphic-fetch'

import config from 'src/config'
import handleGraphQLError from 'src/common/util/handleGraphQLError'
import {serverToServerJWT} from 'src/server/util/jwt'

export default function graphQLFetcher(baseURL, lgJWT = serverToServerJWT()) {
  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        Authorization: `Bearer ${lgJWT}`,
        Origin: config.server.baseURL,
        'Content-Type': 'application/json',
        'LearnersGuild-Skip-Update-User-Middleware': 1,
      },
      body: JSON.stringify(graphQLParams),
    }

    return fetch(`${baseURL}/graphql`, options)
      .then(resp => {
        if (!resp.ok) {
          return resp.json().then(errorResponse => {
            throw errorResponse
          })
        }
        return resp.json()
      })
      .then(graphQLResponse => {
        if (graphQLResponse.errors) {
          throw graphQLResponse
        }

        return graphQLResponse
      })
      .catch(handleGraphQLError)
  }
}
