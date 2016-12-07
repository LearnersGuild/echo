import {GraphQLFloat, GraphQLString} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'UserProjectReview',
  description: 'A user project review',
  fields: () => {
    const {UserProfile} = require('src/server/graphql/schemas')

    return {
      submittedBy: {type: UserProfile, description: 'The review submitter'},
      contribution: {type: GraphQLFloat, description: 'The relative contribution rating'},
      technical: {type: GraphQLFloat, description: 'The technical skill rating'},
      culture: {type: GraphQLFloat, description: 'The culture contribution rating'},
      teamPlay: {type: GraphQLFloat, description: 'The team play rating'},
      focus: {type: GraphQLFloat, description: 'The results focus rating'},
      leadership: {type: GraphQLFloat, description: 'The flexible leadership rating'},
      general: {type: GraphQLString, description: 'General text feedback'},
      createdAt: {type: GraphQLDateTime, description: 'The datetime of the review creation'},
    }
  },
})
