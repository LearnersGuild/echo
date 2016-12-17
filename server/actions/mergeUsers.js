import {findPlayersByIds} from 'src/server/db/player'
import {findModeratorsByIds} from 'src/server/db/moderator'
import {mapById} from 'src/server/util'

export default async function mergeUsers(users, options) {
  if (!Array.isArray(users)) {
    throw new Error('Invalid users input:', users)
  }
  if (users.length === 0) {
    return []
  }

  const {skipNoMatch} = options || {}
  const userIds = users.map(u => u.id)
  const players = mapById(await findPlayersByIds(userIds))
  const moderators = mapById(await findModeratorsByIds(userIds))

  return Object.values(users.reduce((result, user) => {
    const gameUser = players.get(user.id) || moderators.get(user.id)
    if (gameUser) {
      // only return in results if user has a game account
      result[user.id] = Object.assign({}, user, gameUser)
    } else if (!skipNoMatch) {
      throw new Error(`User not found for id ${user.id}, user merge aborted`)
    }
    return result
  }, {}))
}
