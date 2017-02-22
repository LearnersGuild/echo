import {GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectUserSummary',
  description: 'Project user summary',
  fields: () => {
    const {UserProfile, UserProjectStats, UserProjectEvaluation} = require('src/server/graphql/schemas')

    return {
      user: {type: new GraphQLNonNull(UserProfile), description: 'The user'},
      userProjectEvaluations: {type: new GraphQLList(UserProjectEvaluation), description: 'The user\'s project evaluations'},
      userProjectStats: {type: UserProjectStats, description: 'The user\'s project stats'},
      userRetrospectiveComplete: {type: GraphQLBoolean, description: 'True if the user has completed their retrospective survey for this project'},
      userRetrospectiveUnlocked: {type: GraphQLBoolean, description: 'True if the user\'s retrospective survey for this project as been completed but is unlocked.'}
    }
  }
})
