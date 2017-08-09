import {GraphQLNonNull, GraphQLString} from 'graphql'

import {userCan} from 'src/common/util'
import {resolveMember} from 'src/server/graphql/resolvers'
import {MemberSummary} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: MemberSummary,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'The user ID or handle'},
  },
  async resolve(source, args, ast) {
    if (!userCan(ast.rootValue.currentUser, 'viewMemberSummary')) {
      throw new LGNotAuthorizedError()
    }

    return {
      member: await resolveMember(source, args, ast),
    }
  }
}
