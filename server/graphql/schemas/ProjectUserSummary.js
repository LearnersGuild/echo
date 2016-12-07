import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectUserSummary',
  description: 'Project user summary',
  fields: () => {
    const {UserProfile, UserProjectStats, UserProjectReview} = require('src/server/graphql/schemas')

    return {
      user: {type: new GraphQLNonNull(UserProfile), description: 'The user'},
      userProjectReviews: {type: new GraphQLList(UserProjectReview), description: 'The user\'s project reviews'},
      userProjectStats: {type: UserProjectStats, description: 'The user\'s project stats'},
    }
  }
})
