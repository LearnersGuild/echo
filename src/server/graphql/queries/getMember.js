import {GraphQLNonNull, GraphQLString} from 'graphql'

import {resolveMember} from 'src/server/graphql/resolvers'
import {Member} from 'src/server/graphql/schemas'

export default {
  type: Member,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'The user ID or handle'},
  },
  resolve: resolveMember,
}
