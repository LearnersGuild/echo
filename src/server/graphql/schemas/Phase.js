import {GraphQLNonNull, GraphQLID, GraphQLInt, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'Phase',
  description: 'A phase of the program',
  fields: () => {
    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The phase UUID'},
      number: {type: new GraphQLNonNull(GraphQLInt), description: 'The phase number'},
      hasRetrospective: {type: new GraphQLNonNull(GraphQLBoolean), description: 'Projects in the phase will have a retrospective'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
    }
  },
})
