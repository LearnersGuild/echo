/* global window */
export {default as getGraphQLFetcher} from './getGraphQLFetcher'
export {default as getOwnerAndRepoFromGitHubURL} from './getOwnerAndRepoFromGitHubURL'
export {default as mergeEntities} from './mergeEntities'
export {default as userCan} from './userCan'
export {default as getAvatarImageURL} from './getAvatarImageURL'
export {default as getStatRenderer} from './getStatRenderer'

// blatantly stolen from: https://gist.github.com/mathewbyrne/1280286
export function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

export function toSortedArray(obj, attr, options = {}) {
  if (!obj) {
    return
  }
  if (typeof attr !== 'string') {
    return
  }
  const arr = Array.isArray(obj) ? obj : Object.values(obj)
  const sorted = arr.sort((a, b) => {
    if (typeof a[attr] === 'string') {
      return a[attr].localeCompare(b[attr])
    }
    return a[attr] - b[attr]
  })
  return options.desc ? sorted.reverse() : sorted
}

export function roundDecimal(num) {
  // http://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-in-javascript#comment28521418_11832950
  return isNaN(num) ? null : (Math.round((num + 0.00001) * 100) / 100)
}

export function toArray(val) {
  if (Array.isArray(val)) {
    return val
  }
  if (val instanceof Map) {
    return Array.from(val.values())
  }
  if (val instanceof Object) {
    return Object.values(val)
  }
  return [val]
}

export function findAny(coll, value, matchByFields) {
  if (!coll || (!Array.isArray(matchByFields) && typeof matchByFields !== 'string')) {
    return
  }

  const arr = toArray(coll)
  const fields = Array.isArray(matchByFields) ? matchByFields : [matchByFields]

  return arr.find(item => {
    return item && fields.find(field => item[field] === value)
  })
}

export function safeUrl(url) {
  try {
    return window.self === window.top ? url : null
  } catch (err) {
    return null
  }
}

export function objectValuesAreAllNull(obj) {
  return Object.keys(obj).every(key => !obj[key])
}

export function sum(values) {
  if (!Array.isArray(values)) {
    return null
  }
  return values.reduce((result, n) => result + n, 0)
}

export function median(values) {
  const sortedValues = values.slice(0).sort((a, b) => a - b)
  const middle = Math.floor((sortedValues.length - 1) / 2)
  if (sortedValues.length % 2) {
    return sortedValues[middle]
  }

  return (sortedValues[middle] + sortedValues[middle + 1]) / 2.0
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

export function pickRandom(arr) {
  if (!Array.isArray(arr)) {
    return null
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

export function mapById(arr, idKey = 'id') {
  return arr.reduce((result, item) => {
    result.set(item[idKey], item)
    return result
  }, new Map())
}

export function groupById(arr, idKey = 'id') {
  return arr.reduce((result, item) => {
    const groupKey = item[idKey]
    let group = result.get(groupKey)
    if (!group) {
      group = []
    }
    group.push(item)
    result.set(groupKey, group)
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

export function sortByAttr(list, attr) {
  return list.sort(attrCompareFn(attr))
}

export function attrCompareFn(attr) {
  return (a, b) => {
    if (a[attr] < b[attr]) {
      return -1
    }

    if (a[attr] > b[attr]) {
      return 1
    }

    return 0
  }
}

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

export function flatten(potentialArray) {
  if (!Array.isArray(potentialArray)) {
    return potentialArray
  }
  return potentialArray.reduce((result, next) => result.concat(flatten(next)), [])
}
