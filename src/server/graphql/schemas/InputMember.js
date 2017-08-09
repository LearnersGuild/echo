import {GraphQLNonNull, GraphQLID, GraphQLInt} from 'graphql'
import {GraphQLInputObjectType} from 'graphql/type'

export default new GraphQLInputObjectType({
  name: 'InputMember',
  description: 'Input values for member updates',
  fields: () => {
    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: "The member's ID"},
      phaseNumber: {type: GraphQLInt, description: 'The Phase Number'},
    }
  },
})
