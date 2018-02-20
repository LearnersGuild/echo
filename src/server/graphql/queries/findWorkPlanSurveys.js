import {GraphQLList} from 'graphql'

import {userCan} from 'src/common/util'
import findWorkPlanSurveysForMember from 'src/server/actions/findWorkPlanSurveysForMember'
import {Project} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Project),
  async resolve(source, args, {currentUser}) {
    if (!currentUser || !userCan(currentUser, 'findWorkPlanSurveys')) {
      throw new LGNotAuthorizedError()
    }
    return findWorkPlanSurveysForMember(currentUser.id)
  },
}
