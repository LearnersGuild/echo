import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt} from 'graphql'
import {GraphQLURL, GraphQLDateTime} from 'graphql-custom-types'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {PROJECT_STATES} from 'src/common/models/project'

import {
  resolveChapter,
  resolveCycle,
  resolveProjectCoach,
  resolveProjectGoal,
  resolveProjectPlayers,
  resolveProjectStats,
} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Project',
  description: 'A project engaged in by learners to complete some goal',
  fields: () => {
    const {Chapter, Cycle, Goal, ProjectStats, UserProfile} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The project name'},
      state: {type: new GraphQLNonNull(GraphQLString), description: `The project state. One of: ${Object.values(PROJECT_STATES).join(', ')}`},
      chapterId: {type: new GraphQLNonNull(GraphQLID), description: "The chapter's UUID"},
      chapter: {type: Chapter, description: 'The chapter', resolve: resolveChapter},
      cycleId: {type: new GraphQLNonNull(GraphQLID), description: "The cycle's UUID"},
      cycle: {type: Cycle, description: 'The cycle', resolve: resolveCycle},
      goal: {type: Goal, description: 'The project goal', resolve: resolveProjectGoal},
      expectedHours: {type: new GraphQLNonNull(GraphQLInt), description: 'Expected working hours in this project'},
      stats: {type: ProjectStats, description: 'The project stats', resolve: resolveProjectStats},
      playerIds: {type: new GraphQLList(GraphQLID), description: 'The project member UUIDs'},
      coachId: {type: GraphQLID, description: "The project's coach's id"},
      coach: {type: UserProfile, description: 'The project coach', resolve: resolveProjectCoach},
      players: {type: new GraphQLList(UserProfile), description: 'The project members', resolve: resolveProjectPlayers},
      artifactURL: {type: GraphQLURL, description: 'The URL pointing to the output of this project'},
      closedAt: {type: GraphQLDateTime, description: 'When this project was closed'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
    }
  },
})
