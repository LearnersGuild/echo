import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLURL, GraphQLDateTime} from 'graphql-custom-types'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {resolveChapter, resolveCycle} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'ProjectWithReviewResponses',
  description: 'A project which includes any project review survey responses for the current user',
  fields: () => {
    const {Chapter, Cycle, ProjectReviewResponse} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The project name'},
      artifactURL: {type: GraphQLURL, description: 'The URL pointing to the output of this project'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
      chapter: {type: Chapter, description: 'The chapter', resolve: resolveChapter},
      cycle: {type: Cycle, description: 'The cycle', resolve: resolveCycle},
      projectReviewResponses: {
        type: new GraphQLList(ProjectReviewResponse),
        description: 'The responses to the named questions on the project review survey',
      },
    }
  },
})
