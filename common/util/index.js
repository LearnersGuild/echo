export {default as getGraphQLFetcher} from './getGraphQLFetcher'
export {default as getOwnerAndRepoFromGitHubURL} from './getOwnerAndRepoFromGitHubURL'
export {default as mergeEntities} from './mergeEntities'
export {default as userCan} from './userCan'
export {default as getAvatarImageURL} from './getAvatarImageURL'

export function flatten(potentialArray) {
  if (!Array.isArray(potentialArray)) {
    return potentialArray
  }
  return potentialArray.reduce((result, next) => result.concat(flatten(next)), [])
}

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
