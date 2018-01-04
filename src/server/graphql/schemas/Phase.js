import {GraphQLNonNull, GraphQLID, GraphQLString, GraphQLInt} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'Phase',
  description: 'A phase of the program',
  fields: () => {
    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The phase UUID'},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The phase name'},
      number: {type: new GraphQLNonNull(GraphQLInt), description: 'The phase number'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
    }
  },
})
