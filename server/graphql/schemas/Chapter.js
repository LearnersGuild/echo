import {GraphQLString, GraphQLNonNull, GraphQLID, GraphQLInt} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime, GraphQLURL} from 'graphql-custom-types'

import {
  resolveChapterLatestCycle,
  resolveChapterActiveProjectCount,
  resolveChapterActivePlayerCount,
} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Chapter',
  description: 'A group of players in the same location',
  fields: () => {
    const {Cycle} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter name'},
      channelName: {type: new GraphQLNonNull(GraphQLString), description: 'The chat channel name'},
      timezone: {type: new GraphQLNonNull(GraphQLString), description: 'The user timezone'},
      goalRepositoryURL: {type: new GraphQLNonNull(GraphQLURL), description: 'The GitHub goal repository URL'},
      githubTeamId: {type: GraphQLInt, description: 'The GitHub team id'},
      cycleDuration: {type: new GraphQLNonNull(GraphQLString), description: 'Duration of the cycle'},
      cycleEpoch: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The timestamp when the first cycle begins'},
      inviteCodes: {type: new GraphQLList(GraphQLString), description: 'The invite codes associated with this chapter'},
      latestCycle: {type: Cycle, resolve: resolveChapterLatestCycle, description: 'The latest cycle in the chapter'},
      activeProjectCount: {type: GraphQLInt, resolve: resolveChapterActiveProjectCount, description: 'The number of active projects associated with this chapter'},
      activePlayerCount: {type: GraphQLInt, resolve: resolveChapterActivePlayerCount, description: 'The number of active players associated with this chapter'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
    }
  },
})
