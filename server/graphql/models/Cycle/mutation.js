import raven from 'raven'

import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {CYCLE_STATES} from '../../../../common/models/cycle'
import {parseQueryError} from '../../../../server/db/errors'
import {getModeratorById} from '../../../db/moderator'
import {createNextCycleForChapter, getCyclesInStateForChapter} from '../../../db/cycle'
import {userCan} from '../../../../common/util'
import r from '../../../../db/connect'

import {Cycle} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  createCycle: {
    type: Cycle,
    args: {},
    async resolve(source, args, {rootValue: {currentUser}}) {
      if (!userCan(currentUser, 'createCycle')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      try {
        const moderator = await getModeratorById(currentUser.id)
        if (!moderator) {
          throw new GraphQLError('You are not a moderator for the game.')
        }
        if (!moderator.chapterId) {
          throw new GraphQLError('You must be assigned to a chapter to start a new cycle.')
        }

        return await createNextCycleForChapter(moderator.chapterId)
      } catch (rawError) {
        const err = parseQueryError(rawError)
        sentry.captureException(err)
        throw err
      }
    }
  },
  updateCycleState: {
    type: Cycle,
    args: {
      state: {type: new GraphQLNonNull(GraphQLString)},
    },
    resolve(source, args, {rootValue: {currentUser}}) {
      return changeCycleState(args.state, currentUser)
    }
  }
}

async function changeCycleState(newState, currentUser) {
  const newStateIndex = CYCLE_STATES.indexOf(newState)
  if (!userCan(currentUser, 'updateCycle')) {
    throw new GraphQLError('You are not authorized to do that.')
  }
  if (typeof newStateIndex === 'undefined') {
    throw new GraphQLError('Invalid cycle state given.')
  }
  if (newStateIndex === 0) {
    throw new GraphQLError(`You cannot change the cycle state back to ${newState}`)
  }

  try {
    const moderator = await getModeratorById(currentUser.id, {mergeChapter: true})
    if (!moderator) {
      throw new GraphQLError('You are not a moderator for the game.')
    }
    const validOriginState = CYCLE_STATES[newStateIndex - 1]
    const cycles = await getCyclesInStateForChapter(moderator.chapter.id, validOriginState)
    if (!cycles.length > 0) {
      throw new GraphQLError(`No cycles for ${moderator.chapter.name} chapter (${moderator.chapter.id}) in ${validOriginState} state.`)
    }
    const cycle = cycles[0]

    const cycleUpdateResult = await r.table('cycles')
      .get(cycle.id)
      .update({state: newState, updatedAt: r.now()}, {returnChanges: 'always'})
      .run()

    if (cycleUpdateResult.replaced) {
      const returnedCycle = Object.assign({}, cycleUpdateResult.changes[0].new_val, {chapter: cycle.chapter})
      delete returnedCycle.chapterId
      return returnedCycle
    }
    throw new GraphQLError('Could not save cycle, please try again')
  } catch (err) {
    sentry.captureException(err)
    throw err
  }
}
