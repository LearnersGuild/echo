export {default as getGraphQLFetcher} from './getGraphQLFetcher'
export {default as getOwnerAndRepoFromGitHubURL} from './getOwnerAndRepoFromGitHubURL'
export {default as mergeEntities} from './mergeEntities'
export {default as userCan} from './userCan'
export {default as getAvatarImageURL} from './getAvatarImageURL'
export {default as domOnlyProps} from './domOnlyProps'

export function flatten(potentialArray) {
  if (!Array.isArray(potentialArray)) {
    return potentialArray
  }
  return potentialArray.reduce((result, next) => result.concat(flatten(next)), [])
}
