import {GraphQLNonNull, GraphQLID} from 'graphql'

import deactivateMember from 'src/server/actions/deactivateMember'
import {userCan} from 'src/common/util'
import {Member} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: Member,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLID), description: 'The member ID'}
  },
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'deactivateMember')) {
      throw new LGNotAuthorizedError('You are not authorized to deactivate members.')
    }

    return await deactivateMember(identifier)
  }
}
