import {Member} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import {LGBadRequestError} from 'src/server/util/error'

export default async function mergeMembers(users, options) {
  if (!Array.isArray(users)) {
    throw new LGBadRequestError('Invalid users input:', users)
  }
  if (users.length === 0) {
    return []
  }

  const {skipNoMatch, join, without} = options || {}
  const userIds = users.map(u => u.id)

  const members = mapById(await _getAll(Member, userIds, {join, without}))

  return Object.values(users.reduce((result, user) => {
    const echoUser = members.get(user.id)
    if (echoUser) {
      // only return in results if user has an echo account
      result[user.id] = Object.assign({}, user, echoUser)
    } else if (!skipNoMatch) {
      throw new LGBadRequestError(`Member not found for user id ${user.id}, merge aborted`)
    }
    return result
  }, {}))
}

function _getAll(Model, ids, options = {}) {
  let query = Model.getAll(...ids)
  if (options.join) {
    query = query.getJoin(options.join)
  }
  if (options.without) {
    query = query.without(options.without)
  }
  return query
}
