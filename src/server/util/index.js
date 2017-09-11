import fs from 'fs'
import config from 'src/config'
import raven from 'raven'

const sentry = new raven.Client(config.server.sentryDSN)

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
      } catch (err) {
        reject(err)
      }
    })
  })
}

export function logRejection(promise, message = '') {
  return promise.catch(err => {
    console.warn(message, err.stack || err)
    sentry.captureException(err)
  })
}

export {
  sum,
  median,
  avg,
  toPercent,
  toArray,
  toPairs,
  pickRandom,
  mapById,
  groupById,
  safePushInt,
  unique,
  range,
  repeat,
  choose,
  factorial,
  sortByAttr,
  attrCompareFn,
  shuffle,
  segment,
  flatten,
  slugify,
  toSortedArray,
  roundDecimal,
  findAny,
} from 'src/common/util'
