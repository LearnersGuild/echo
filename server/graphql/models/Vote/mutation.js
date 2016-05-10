import raven from 'raven'

import {GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {GraphQLURL} from 'graphql-custom-types'

import {Vote} from './schema'
import {getPlayerById, getGoalSelectionCyclesForChapter} from '../../helpers'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  voteForGoals: {
    type: Vote,
    args: {
      playerId: {type: GraphQLID},
      goals: {type: new GraphQLList(GraphQLURL)},
    },
    async resolve(source, {playerId, goals}, {rootValue: {currentUser}}) {
      // only signed-in users can vote
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      // if no playerId was passed, assume the currentUser
      try {
        const player = await getPlayerById(playerId ? playerId : currentUser.id)
        if (!player) {
          throw new GraphQLError('You are not a player in the game.')
        }

        const now = r.now()
        const cycles = await getGoalSelectionCyclesForChapter(player.chapter.id)
        if (!cycles.length > 0) {
          throw new GraphQLError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in GOAL_SELECTION state.`)
        }
        const cycle = cycles[0]

        // ensure that the goals being voted on are appropriate for this chapter
        const goalObjs = goals.map(url => {
          if (url.indexOf(`${player.chapter.goalRepositoryURL}/issues`) < 0) {
            throw new GraphQLError(`Goal ${url} not from the goal library ${player.chapter.goalRepositoryURL}`)
          }
          return {url}
        })

        // see if the player has already voted to determine whether to insert
        // or update
        const playerVotes = await r.table('votes')
          .getAll([player.id, cycle.id], {index: 'playerIdAndCycleId'})
          .run()
        const playerVote = playerVotes.length > 0 ?
          Object.assign({}, playerVotes[0], {goals: goalObjs}) : {
            playerId: player.id,
            cycleId: cycle.id,
            goals: goalObjs,
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
        sentry.captureException(err)
        throw err
      }
    }
  },
}
