import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLURL, GraphQLDateTime} from 'graphql-custom-types'
import {GraphQLObjectType} from 'graphql/type'

import {
  resolveChapter,
  resolveCycle,
  resolveProjectGoal,
  resolveProjectStats,
} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Project',
  description: 'A project engaged in by learners to complete some goal',
  fields: () => {
    const {Chapter, Cycle, Goal, ProjectStats} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The project name'},
      chapter: {type: Chapter, description: 'The chapter', resolve: resolveChapter},
      cycle: {type: Cycle, description: 'The cycle', resolve: resolveCycle},
      goal: {type: Goal, description: 'The project goal', resolve: resolveProjectGoal},
      stats: {type: ProjectStats, description: 'The project stats', resolve: resolveProjectStats},
      artifactURL: {type: GraphQLURL, description: 'The URL pointing to the output of this project'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
    }
  },
})
