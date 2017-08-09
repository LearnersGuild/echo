import {GraphQLNonNull} from 'graphql'

import {userCan} from 'src/common/util'
import {Member, InputMember} from 'src/server/graphql/schemas'
import updateMember from 'src/server/actions/updateMember'
import getMemberUser from 'src/server/actions/getMemberUser'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: Member,
  args: {
    values: {type: new GraphQLNonNull(InputMember)},
  },
  async resolve(source, {values}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'updateMember')) {
      throw new LGNotAuthorizedError()
    }

    await updateMember(values)
    return getMemberUser(values.id)
  }
}
