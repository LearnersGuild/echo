import raven from 'raven'

import {GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getCycleById, getLatestCycleForChapter} from '../../../db/cycle'
import {getPlayerById} from '../../../db/player'
import {customQueryError} from '../../../db/errors'
import r from '../../../../db/connect'

import {CycleVotingResults} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getCycleVotingResults: {
    type: CycleVotingResults,
    args: {
      cycleId: {type: GraphQLID}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      // only signed-in users can vote
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      try {
        const cycle = args.cycleId ?
          await getCycleById(args.cycleId, {mergeChapter: true}) :
          await getPlayerById(currentUser.id)
            .default(customQueryError('You are not a player in the game.'))
            .then(player => getLatestCycleForChapter(player.chapterId, {mergeChapter: true}))

        const numEligiblePlayers = await r.table('players')
          .getAll(cycle.chapter.id, {index: 'chapterId'})
          .count()
          .run()

        const validVotesQuery = r.table('votes')
          .getAll(cycle.id, {index: 'cycleId'})
          .hasFields('goals')

        const numVotes = await validVotesQuery.count().run()

        const candidateGoals = await validVotesQuery
          .group(r.row('goals').pluck('url', 'title'), {multi: true})
          .ungroup()
          .map(doc => {
            return {
              goal: doc('group'),
              playerGoalRanks: doc('reduction').map(vote => {
                return {
                  playerId: vote('playerId'),
                  goalRank: vote('goals')('url').offsetsOf(doc('group')('url')).nth(0)
                }
              })
            }
          })
          .orderBy(r.desc(r.row('playerGoalRanks').count()))
          .run()

        return {
          id: 'cycleVotingResults',
          cycle,
          numEligiblePlayers,
          numVotes,
          candidateGoals,
        }
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  }
}
