import {GraphQLInt} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectLevels',
  description: 'A project\'s starting and ending levels for a user',
  fields: () => {
    return {
      starting: {type: GraphQLInt, description: 'Level at beginning of project'},
      ending: {type: GraphQLInt, description: 'Level at end of project'},
    }
  }
})
