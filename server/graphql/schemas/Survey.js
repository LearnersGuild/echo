import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

import {resolveProject} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Survey',
  description: 'A survey of questions used for retrospectives',
  fields: () => {
    const {Project, SurveyQuestion} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: "The survey's user UUID"},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
      questions: {type: new GraphQLNonNull(new GraphQLList(SurveyQuestion)), description: 'The questions for the survey'},
      project: {type: Project, description: 'The project this survey relates to', resolve: resolveProject},
    }
  },
})
