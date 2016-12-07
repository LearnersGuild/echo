import {GraphQLString, GraphQLInt, GraphQLNonNull} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLURL} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'Goal',
  description: 'A goal for a project team to work on',
  fields: () => {
    return {
      number: {type: new GraphQLNonNull(GraphQLInt), description: 'The goal number'},
      url: {type: new GraphQLNonNull(GraphQLURL), description: 'The goal URL'},
      title: {type: GraphQLString, description: 'The goal title'},
      level: {type: GraphQLString, description: 'The goal level'},
    }
  },
})
