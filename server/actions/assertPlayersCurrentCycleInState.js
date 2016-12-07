import {GraphQLError} from 'graphql/error'

import {getLatestCycleForChapter} from 'src/server/db/cycle'
import {getPlayerById} from 'src/server/db/player'

export default async function assertPlayersCurrentCycleInState(currentUser, state) {
  const player = await getPlayerById(currentUser.id, {mergeChapter: true})
  const cycleInReflection = await getLatestCycleForChapter(player.chapter.id)('state').eq(state)

  if (!cycleInReflection) {
    throw new GraphQLError(`This action is not allowed when the cycle is not in the ${state} state`)
  }
}
