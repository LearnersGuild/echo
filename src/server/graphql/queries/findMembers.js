import {GraphQLString} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Member} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Member),
  args: {
    identifiers: {type: new GraphQLList(GraphQLString)},
  },
  async resolve(source, {identifiers}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'findMembers')) {
      throw new LGNotAuthorizedError()
    }

    return findMemberUsers(identifiers, {
      skipNoMatch: true,
      join: {phase: true, chapter: true},
      without: {chapter: {inviteCodes: true}},
    })
  }
}
