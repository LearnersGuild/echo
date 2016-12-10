import {GraphQLError} from 'graphql/error'

import {parseQueryError} from 'src/server/db/errors'

export {default as GraphQLPhoneNumber} from './GraphQLPhoneNumber'

export function handleError(unparsedError, defaultMsg) {
  const err = parseQueryError(unparsedError)
  if (err.name === 'BadInputError' || err.name === 'LGCustomQueryError') {
    throw err
  }
  throw new GraphQLError(defaultMsg || err.message || err)
}

export function pruneAutoLoad(loadedModules) {
  if (!loadedModules) {
    return
  }
  return Object.keys(loadedModules).reduce((result, name) => {
    if (!name.startsWith('_') && name !== 'index') {
      result[name] = loadedModules[name]
    }
    return result
  }, {})
}
