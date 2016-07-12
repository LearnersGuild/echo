import {GraphQLString, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {GOAL_SELECTION} from '../../../../common/models/cycle'
import {getPlayerById} from '../../../db/player'
import {getCyclesInStateForChapter} from '../../../db/cycle'
import {handleError} from '../../../../server/graphql/models/util'
import r from '../../../../db/connect'

import {Vote} from './schema'

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

        const now = r.now()
        const cycles = await getCyclesInStateForChapter(player.chapter.id, GOAL_SELECTION)
        if (!cycles.length > 0) {
          throw new GraphQLError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in ${GOAL_SELECTION} state.`)
        }

        const cycle = cycles[0]

        // see if the player has already voted to determine whether to insert
        // or update
        const playerVotes = await r.table('votes')
          .getAll([player.id, cycle.id], {index: 'playerIdAndCycleId'})
          .run()

        const playerVote = playerVotes.length > 0 ?
          Object.assign({}, playerVotes[0], {
            notYetValidatedGoalDescriptors: goalDescriptors,
            pendingValidation: true
          }) : {
            playerId: player.id,
            cycleId: cycle.id,
            notYetValidatedGoalDescriptors: goalDescriptors,
            pendingValidation: true,
          }
        let voteWithTimestamps = Object.assign(playerVote, {updatedAt: now})
        let savedVote
        if (playerVote.id) {
          savedVote = await r.table('votes')
            .get(playerVote.id)
            .update(voteWithTimestamps, {returnChanges: 'always'})
            .run()
        } else {
          voteWithTimestamps = Object.assign(voteWithTimestamps, {createdAt: now})
          savedVote = await r.table('votes')
            .insert(voteWithTimestamps, {returnChanges: 'always'})
            .run()
        }

        if (savedVote.replaced || savedVote.inserted) {
          const returnedVote = Object.assign({}, savedVote.changes[0].new_val, {player, cycle})
          delete returnedVote.playerId
          delete returnedVote.cycleId
          return returnedVote
        }
        throw new GraphQLError('Could not save vote.')
      } catch (err) {
        handleError(err)
      }
    }
  },
}
