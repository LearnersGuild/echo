import {GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'UserStatContribution',
  description: 'Relative contribution stats',
  fields: () => {
    return {
      other: {type: GraphQLFloat, description: 'Teammate-rated relative contribution'},
      self: {type: GraphQLFloat, description: 'Self-rated relative contribution'},
      perHour: {type: GraphQLFloat, description: 'Relative contribution per hour'},
      expected: {type: GraphQLFloat, description: 'Expected contribution'},
      estimated: {type: GraphQLFloat, description: 'Estimated contribution'},
      delta: {type: GraphQLFloat, description: 'Expected contribution delta'},
    }
  }
})
