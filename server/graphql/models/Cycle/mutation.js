import raven from 'raven'

import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt} from 'graphql'
import {GraphQLInputObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {GraphQLDateTime} from 'graphql-custom-types'

import {CYCLE_STATES} from '../../../../common/models/cycle'
import {getModeratorById, getCyclesInStateForChapter} from '../../helpers'
import {Cycle, CycleState} from './schema'
import {userCan} from '../../../../common/util'
import {cycleSchema} from '../../../../common/validations'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export const InputCycle = new GraphQLInputObjectType({
  name: 'InputCycle',
  description: 'The cycle',
  fields: () => ({
    id: {type: GraphQLID, description: 'The cycle UUID'},
    chapterId: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
    cycleNumber: {type: new GraphQLNonNull(GraphQLInt), description: 'Sequential cycle number'},
    startTimestamp: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The start time'},
    state: {type: CycleState, description: 'What state the cycle is currently in'},
  })
})

export default {
  createOrUpdateCycle: {
    type: Cycle,
    args: {
      cycle: {type: new GraphQLNonNull(InputCycle)},
    },
    async resolve(source, {cycle}, {rootValue: {currentUser}}) {
      if (cycle.id && !userCan(currentUser, 'updateCycle') || !cycle.id && !userCan(currentUser, 'createCycle')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        await cycleSchema.validate(cycle) // validation error will be thrown if invalid
        const chapter = await r.table('chapters').get(cycle.chapterId).run()
        if (!chapter) {
          throw new GraphQLError(`No chapter exists with id ${cycle.chapterId}`)
        }
        const now = r.now()
        let cycleWithTimestamps = Object.assign(cycle, {updatedAt: now})
        let savedCycle
        if (cycle.id) {
          savedCycle = await r.table('cycles')
            .get(cycle.id)
            .update(cycleWithTimestamps, {returnChanges: 'always'})
            .run()
        } else {
          cycleWithTimestamps = Object.assign(cycleWithTimestamps, {createdAt: now})
          savedCycle = await r.table('cycles')
            .insert(cycleWithTimestamps, {returnChanges: 'always'})
            .run()
        }

        if (savedCycle.replaced || savedCycle.inserted) {
          const returnedCycle = Object.assign({}, savedCycle.changes[0].new_val, {chapter})
          delete returnedCycle.chapterId
          return returnedCycle
        }
        throw new GraphQLError('Could not save cycle, please try again')
      } catch (err) {
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
  if (typeof newStateIndex === 'undefined') {
    throw new GraphQLError(`Invalid cycle state given.`)
  }
  if (newStateIndex === 0) {
    throw new GraphQLError(`You cannot change the cycle state back to ${newState}`)
  }
  if (!userCan(currentUser, 'updateCycle')) {
    throw new GraphQLError('You are not authorized to do that.')
  }

  try {
    const moderator = await getModeratorById(currentUser.id)
    if (!moderator) {
      throw new GraphQLError('You are not a moderator for the game.')
    }
    const validOriginState = CYCLE_STATES[newStateIndex - 1]
    const cycles = await getCyclesInStateForChapter(moderator.chapter.id, validOriginState)
    if (!cycles.length > 0) {
      throw new GraphQLError(`No cycles for ${moderator.chapter.name} chapter (${moderator.chapter.id}) in ${validOriginState} state.`)
    }
    const cycle = cycles[0]

    const savedCycle = await r.table('cycles')
      .get(cycle.id)
      .update({state: newState, updatedAt: r.now()}, {returnChanges: 'always'})
      .run()

    if (savedCycle.replaced) {
      const returnedCycle = Object.assign({}, savedCycle.changes[0].new_val, {chapter: cycle.chapter})
      delete returnedCycle.chapterId
      return returnedCycle
    }
    throw new GraphQLError('Could not save cycle, please try again')
  } catch (err) {
    sentry.captureException(err)
    throw err
  }
}
