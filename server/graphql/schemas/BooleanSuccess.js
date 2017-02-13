import {GraphQLBoolean} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'BooleanSuccess',
  description: 'An object with a simple boolean flag reporting success or failure',
  fields: {
    success: {type: GraphQLBoolean}
  }
})
