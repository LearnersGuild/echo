import {GraphQLFloat, GraphQLInt} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'UserProjectStats',
  description: 'A user\'s stats for a project',
  fields: () => {
    const {UserStatContribution} = require('src/server/graphql/schemas')

    return {
      rating: {type: GraphQLInt, description: 'Rating'},
      xp: {type: GraphQLFloat, description: 'Experience points'},
      hours: {type: GraphQLFloat, description: 'Hours spent contributing to the project'},
      culture: {type: GraphQLFloat, description: 'Culture contribution'},
      technical: {type: GraphQLFloat, description: 'Technical support'},
      teamPlay: {type: GraphQLFloat, description: 'Team play'},
      receptiveness: {type: GraphQLFloat, description: 'Receptiveness score'},
      focus: {type: GraphQLFloat, description: 'Results focus score'},
      leadership: {type: GraphQLFloat, description: 'Flexible leadership score'},
      friction: {type: GraphQLFloat, description: 'Friction reduction score'},
      contribution: {type: UserStatContribution, description: 'Contribution stats'},
    }
  }
})
