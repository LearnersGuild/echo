import url from 'url'
import jwt from 'jsonwebtoken'
import fetch from 'isomorphic-fetch'
import getBullQueue from 'bull'
import {graphQLErrorHandler} from '../../common/util/getGraphQLFetcher'

const JWT_ISSUER = 'learnersguild.org'

export function serverToServerJWT() {
  /* eslint-disable camelcase */
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + (60 * 10),  // 10 minutes from now
    sub: 0,
    name: 'Server-to-Server Authentication',
    preferred_username: '__server_to_server__',
    email: 'noreply@learnersguild.org',
    emails: 'noreply@learnersguild.org',
    roles: 'backoffice',
  }
  return jwt.sign(claims, process.env.JWT_PRIVATE_KEY, {algorithm: 'RS512'})
}

export function graphQLFetcher(baseURL, lgJWT = serverToServerJWT()) {
  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${lgJWT}`,
        'Origin': process.env.APP_BASEURL,
        'Content-Type': 'application/json',
        'LearnersGuild-Skip-Update-User-Middleware': 1,
      },
      body: JSON.stringify(graphQLParams),
    }

    return fetch(`${baseURL}/graphql`, options)
      .then(resp => {
        if (!resp.ok) {
          return Promise.reject(`GraphQL request resulted in an ERROR: ${resp.statusText}`)
        }
        return resp.json()
      })
      .then(graphQLErrorHandler)
  }
}

export function getQueue(queueName) {
  const redisConfig = url.parse(process.env.REDIS_URL)
  /* eslint-disable camelcase */
  const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : undefined
  return getBullQueue(queueName, redisConfig.port, redisConfig.hostname, redisOpts)
}
