import {GraphQLString, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {connect} from 'src/db'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {getPlayerById} from 'src/server/db/player'
import {saveVote} from 'src/server/db/vote'
import {getCyclesInStateForChapter} from 'src/server/db/cycle'
import {getPoolByCycleIdAndPlayerId} from 'src/server/db/pool'
import {handleError} from 'src/server/graphql/models/util'
import {Vote} from './schema'

const r = connect()

export default {
  voteForGoals: {
    type: Vote,
    args: {
      playerId: {type: GraphQLID},
      goalDescriptors: {type: new GraphQLList(GraphQLString)},
    },
    async resolve(source, {playerId, goalDescriptors}, {rootValue: {currentUser}}) {
      // only signed-in users can vote
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      try {
        const player = await getPlayerById(playerId ? playerId : currentUser.id, {mergeChapter: true})
        if (!player) {
          throw new GraphQLError('You are not a player in the game.')
        }

        if (goalDescriptors.length > 1 && goalDescriptors[0] === goalDescriptors[1]) {
          throw new GraphQLError('You cannot vote for the same goal twice.')
        }

        const cycles = await getCyclesInStateForChapter(player.chapter.id, GOAL_SELECTION)
        if (!cycles.length > 0) {
          throw new GraphQLError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in ${GOAL_SELECTION} state.`)
        }

        const cycle = cycles[0]
        const pool = await getPoolByCycleIdAndPlayerId(cycle.id, player.id)

        // see if the player has already voted to determine whether to insert
        // or update
        const playerVotes = await r.table('votes')
          .getAll([player.id, pool.id], {index: 'playerIdAndPoolId'})
          .run()

        const playerVote = playerVotes.length > 0 ?
          Object.assign({}, playerVotes[0], {
            notYetValidatedGoalDescriptors: goalDescriptors,
            pendingValidation: true,
          }) : {
            playerId: player.id,
            poolId: pool.id,
            notYetValidatedGoalDescriptors: goalDescriptors,
            pendingValidation: true,
          }
        delete playerVote.updatedAt
        const result = await saveVote(playerVote, {returnChanges: true})

        if (result.replaced || result.inserted) {
          const returnedVote = Object.assign({}, result.changes[0].new_val, {player, cycle})
          delete returnedVote.playerId
          delete returnedVote.poolId
          return returnedVote
        }
        throw new GraphQLError('Could not save vote.')
      } catch (err) {
        handleError(err)
      }
    }
  },
}
