import {GraphQLList} from 'graphql'

import {userCan} from 'src/common/util'
import findProjectsWithWorkPlansForMember from 'src/server/actions/findProjectsWithWorkPlansForMember'
import {Project} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Project),
  async resolve(source, args, {currentUser}) {
    if (!currentUser || !userCan(currentUser, 'findProjectsWithWorkPlans')) {
      throw new LGNotAuthorizedError()
    }
    return findProjectsWithWorkPlansForMember(currentUser.id)
  },
}
