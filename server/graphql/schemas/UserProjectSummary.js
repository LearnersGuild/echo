import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'UserProjectSummary',
  description: 'User project summary',
  fields: () => {
    const {Project, UserProjectStats, UserProjectReview} = require('src/server/graphql/schemas')

    return {
      project: {type: new GraphQLNonNull(Project), description: 'The project'},
      userProjectReviews: {type: new GraphQLList(UserProjectReview), description: 'The user\'s project reviews'},
      userProjectStats: {type: UserProjectStats, description: 'The user\'s project stats'},
    }
  }
})
