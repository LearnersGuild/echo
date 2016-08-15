import {GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getPlayerById} from '../../../db/player'
import {getModeratorById} from '../../../db/moderator'
import {customQueryError} from '../../../db/errors'

import getCycleVotingResults from '../../../../server/actions/getCycleVotingResults'
import {handleError} from '../../../../server/graphql/models/util'

import {CycleVotingResults} from './schema'

export default {
  getCycleVotingResults: {
    type: CycleVotingResults,
    args: {
      cycleId: {type: GraphQLID}
    },
    async resolve(source, {cycleId}, {rootValue: {currentUser}}) {
      // only signed-in users can view results
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      try {
        const user = await getPlayerById(currentUser.id)
          .default(
            getModeratorById(currentUser.id)
              .default(
                customQueryError('You are not a player or moderator in the game.')
              )
          )

        return await getCycleVotingResults(user.chapterId, cycleId /* , getPoolIdForPlayer(user.id, cycleId) */)
      } catch (err) {
        handleError(err)
      }
    }
  }
}
