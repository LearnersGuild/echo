import {GraphQLFloat} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectStats',
  description: 'A project\'s stats',
  fields: () => {
    return {
      hours: {type: GraphQLFloat, description: 'Total hours worked by all members'},
      quality: {type: GraphQLFloat, description: 'Quality score (avg.)'},
      completeness: {type: GraphQLFloat, description: 'Completeness score (avg.)'},
    }
  }
})
