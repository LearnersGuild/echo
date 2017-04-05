import {GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'Status',
  description: 'The status of a response',
  fields: () => {
    return {
      success: {type: new GraphQLNonNull(GraphQLBoolean), description: 'The request was successfully processed'},
    }
  },
})
