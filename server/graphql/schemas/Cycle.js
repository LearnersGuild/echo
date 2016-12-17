import {GraphQLNonNull, GraphQLID, GraphQLInt} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

import {resolveChapter} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Cycle',
  description: 'A period of time in the game',
  fields: () => {
    const {CycleState, Chapter} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
      cycleNumber: {type: new GraphQLNonNull(GraphQLInt), description: 'Sequential cycle number'},
      startTimestamp: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The cycle start time'},
      endTimestamp: {type: GraphQLDateTime, description: 'The cycle end time'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The time when the cycle created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The time when the cycle was last updated'},
      state: {type: CycleState, description: 'What state the cycle is currently in'},
      chapter: {type: Chapter, description: 'The chapter', resolve: resolveChapter},
    }
  },
})
