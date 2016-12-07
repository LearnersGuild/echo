import {GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'ProjectReview',
  description: 'A project review',
  fields: () => {
    const {UserProfile} = require('src/server/graphql/schemas')

    return {
      submittedBy: {type: UserProfile, description: 'The review submitter'},
      completeness: {type: GraphQLFloat, description: 'The completeness rating'},
      quality: {type: GraphQLFloat, description: 'The quality rating'},
      createdAt: {type: GraphQLDateTime, description: 'The datetime of the review creation'},
    }
  },
})
