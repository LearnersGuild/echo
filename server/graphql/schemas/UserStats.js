import {GraphQLInt, GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'UserStats',
  description: 'A user\'s overall stats',
  fields: () => {
    return {
      rating: {type: GraphQLInt, description: 'User rating'},
      xp: {type: GraphQLFloat, description: 'Experience points'},
    }
  }
})
