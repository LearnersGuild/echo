import {GraphQLNonNull, GraphQLID, GraphQLInt} from 'graphql'
import {GraphQLObjectType, GraphQLEnumType} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

import {Chapter, chapterResolver} from '../Chapter/schema'
import {CYCLE_STATES} from '../../../../common/models/cycle'
import {getCycleById} from '../../../../server/db/cycle'

const cycleStateValues = CYCLE_STATES.reduce((reduced, state) => {
  return Object.assign(reduced, {[state]: {}})
}, {})

export const CycleState = new GraphQLEnumType({
  name: 'CycleState',
  values: cycleStateValues,
})

export const Cycle = new GraphQLObjectType({
  name: 'Cycle',
  description: 'A period of time in the game',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
    chapter: {
      type: Chapter,
      description: 'The chapter',
      resolve: chapterResolver,
    },
    cycleNumber: {type: new GraphQLNonNull(GraphQLInt), description: 'Sequential cycle number'},
    startTimestamp: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The start time'},
    state: {type: CycleState, description: 'What state the cycle is currently in'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  }),
})

export async function cycleResolver(parent /* , args, ast */) {
  if (parent.cycle) {
    return parent.cycle
  }

  if (parent.cycleId) {
    return await getCycleById(parent.cycleId)
  }
}
