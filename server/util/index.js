import fs from 'fs'
import url from 'url'
import jwt from 'jsonwebtoken'
import fetch from 'isomorphic-fetch'
import getBullQueue from 'bull'
import socketCluster from 'socketcluster-client'

import config from 'src/config'
import {graphQLErrorHandler} from 'src/common/util/getGraphQLFetcher'

const JWT_ISSUER = 'learnersguild.org'

// TODO: fix this! we're effectively using module caching to create a singleton. yuck.
let socket = null

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
  return jwt.sign(claims, config.server.jwt.privateKey, {algorithm: config.server.jwt.algorithm})
}

export function graphQLFetcher(baseURL, lgJWT = serverToServerJWT()) {
  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${lgJWT}`,
        'Origin': config.server.baseURL,
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
  const redisConfig = url.parse(config.server.redis.url)
  /* eslint-disable camelcase */
  const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : undefined
  return getBullQueue(queueName, redisConfig.port, redisConfig.hostname, redisOpts)
}

export function getSocket() {
  if (socket) {
    return socket
  }

  socket = socketCluster.connect({hostname: config.server.sockets.host})
  socket.on('connect', () => console.log('... socket connected'))
  socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
  socket.on('connectAbort', () => null)
  socket.on('error', error => console.warn(error.message))

  return socket
}

export function sum(values) {
  if (!Array.isArray(values)) {
    return null
  }
  return values.reduce((result, n) => result + n, 0)
}

export function avg(values) {
  const sumValues = sum(values)
  if (isNaN(sumValues)) {
    return sumValues
  }
  if (sumValues === 0) {
    return 0
  }
  return (sumValues / values.length)
}

export function toPercent(num) {
  return isNaN(num) ? NaN : (num * 100)
}

export function toArray(val) {
  if (Array.isArray(val)) {
    return val
  }
  if (val instanceof Map) {
    return Array.from(val.values())
  }
  return [val]
}

export function toPairs(arr) {
  if (!Array.isArray(arr)) {
    return null
  }
  if (arr.length < 2) {
    return []
  }
  const pairs = []
  for (let i = 0, len = arr.length - 1; i < len; i++) {
    for (let j = (i + 1); j < arr.length; j++) {
      pairs.push([arr[i], arr[j]])
    }
  }
  return pairs
}

export function roundDecimal(num) {
  // http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript#comment28521418_11832950
  return isNaN(num) ? null : (Math.round((num + 0.00001) * 100) / 100)
}

export function pickRandom(arr) {
  if (!Array.isArray(arr)) {
    return null
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

export function mapById(arr) {
  return arr.reduce((result, el) => {
    result.set(el.id, el)
    return result
  }, new Map())
}

export function safePushInt(arr, num) {
  const value = parseInt(num, 10)
  if (!isNaN(value)) {
    arr.push(value)
  }
}

export function unique(array) {
  return Array.from(new Set(array))
}

export function flatten(potentialArray) {
  if (!Array.isArray(potentialArray)) {
    return potentialArray
  }
  return potentialArray.reduce((result, next) => result.concat(flatten(next)), [])
}

export function range(start, length) {
  return Array.from(Array(length), (x, i) => i + start)
}

export function repeat(length, element) {
  return Array.from(Array(length), () => element)
}

// https://en.wikipedia.org/wiki/Combination
export function choose(n, k) {
  if (k === 0) {
    return 1
  }
  return (n * choose(n - 1, k - 1)) / k
}

export const factorial = (function () {
  const f = []
  return function factorial(n) {
    if (n === 0 || n === 1) {
      return 1
    }

    if (f[n] > 0) {
      return f[n]
    }

    f[n] = n * factorial(n - 1)

    return f[n]
  }
})()

export function shuffle(array) {
  const result = toArray(array)

  // While there remain elements to shuffle...
  let currentIndex = result.length
  while (currentIndex !== 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    const temporaryValue = result[currentIndex]
    result[currentIndex] = result[randomIndex]
    result[randomIndex] = temporaryValue
  }

  return result
}

export function segment(array, n) {
  const length = array.length
  array = array.slice(0)
  const segmentSize = Math.ceil(length / n)
  return range(0, n).map(() => array.splice(0, segmentSize))
}

export function loadJSON(filePath, validateItem = item => item) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      try {
        const items = JSON.parse(data)

        if (!Array.isArray(items)) {
          return reject(new Error('File parse error: data must be a JSON array'))
        }

        resolve(items.map(validateItem))
      } catch (validationErr) {
        reject(validationErr)
      }
    })
  })
}
