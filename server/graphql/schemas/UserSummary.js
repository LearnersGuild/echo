import {GraphQLNonNull} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {resolveUserProjectSummaries} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'UserSummary',
  description: 'User summary',
  fields: () => {
    const {UserProfile, UserProjectSummary} = require('src/server/graphql/schemas')

    return {
      user: {type: new GraphQLNonNull(UserProfile), description: 'The user'},
      userProjectSummaries: {type: new GraphQLList(UserProjectSummary), resolve: resolveUserProjectSummaries, description: 'The user\'s project summaries'},
    }
  }
})
