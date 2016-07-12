import {GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getCycleById, getLatestCycleForChapter} from '../../../db/cycle'
import {getPlayerById} from '../../../db/player'
import {getModeratorById} from '../../../db/moderator'
import {customQueryError, parseQueryError} from '../../../db/errors'
import {handleError} from '../../../../server/graphql/models/util'
import r from '../../../../db/connect'

import {CycleVotingResults} from './schema'

export default {
  getCycleVotingResults: {
    type: CycleVotingResults,
    args: {
      cycleId: {type: GraphQLID}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
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
        const cycle = args.cycleId ?
          await getCycleById(args.cycleId, {mergeChapter: true}) :
          await getLatestCycleForChapter(user.chapterId, {mergeChapter: true})

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
        handleError(err)
      }
    }
  }
}
