import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt, GraphQLBoolean} from 'graphql'
import {GraphQLURL, GraphQLDateTime} from 'graphql-custom-types'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {
  resolveChapter,
  resolveCycle,
  resolveProjectGoal,
  resolveProjectStats,
  resolveProjectPlayers,
} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Project',
  description: 'A project engaged in by learners to complete some goal',
  fields: () => {
    const {Chapter, Cycle, Goal, ProjectStats, UserProfile} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The project name'},
      chapterId: {type: new GraphQLNonNull(GraphQLID), description: "The chapter's UUID"},
      chapter: {type: Chapter, description: 'The chapter', resolve: resolveChapter},
      cycleId: {type: new GraphQLNonNull(GraphQLID), description: "The cycle's UUID"},
      cycle: {type: Cycle, description: 'The cycle', resolve: resolveCycle},
      goal: {type: Goal, description: 'The project goal', resolve: resolveProjectGoal},
      expectedHours: {type: new GraphQLNonNull(GraphQLInt), description: 'Expected working hours in this project'},
      stats: {type: ProjectStats, description: 'The project stats', resolve: resolveProjectStats},
      playerIds: {type: new GraphQLList(GraphQLID), description: 'The project member UUIDs'},
      players: {type: new GraphQLList(UserProfile), description: 'The project members', resolve: resolveProjectPlayers},
      artifactURL: {type: GraphQLURL, description: 'The URL pointing to the output of this project'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'}
      lockedStatus: {type: new GraphQLNonNull(GraphQLBoolean), description: 'True if the user has completed or locked the survey'}
    }
  },
})
