import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {getModeratorById} from 'src/server/db/moderator'
import createNextCycleForChapter from 'src/server/actions/createNextCycleForChapter'
import {Cycle} from 'src/server/graphql/schemas'

export default {
  type: Cycle,
  args: {},
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'createCycle')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const moderator = await getModeratorById(currentUser.id)
    if (!moderator) {
      throw new GraphQLError('You are not a moderator for the game.')
    }
    if (!moderator.chapterId) {
      throw new GraphQLError('You must be assigned to a chapter to start a new cycle.')
    }

    return await createNextCycleForChapter(moderator.chapterId)
  }
}
