import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {
  resolveProjectReviews,
  resolveProjectUserSummaries,
} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'ProjectSummary',
  description: 'Summary of project details',
  fields: () => {
    const {Project, ProjectReview, ProjectUserSummary} = require('src/server/graphql/schemas')

    return {
      project: {type: new GraphQLNonNull(Project), description: 'The project'},
      projectReviews: {type: new GraphQLList(ProjectReview), resolve: resolveProjectReviews, description: 'The project\'s reviews'},
      projectUserSummaries: {type: new GraphQLList(ProjectUserSummary), resolve: resolveProjectUserSummaries, description: 'The project\'s user summaries'},
    }
  }
})
