import {GraphQLNonNull, GraphQLID} from 'graphql'
import {lockRetroSurveyForUser} from 'src/server/actions/retroSurveyLockUnlock'
import userCan from 'src/common/util/userCan'
import Project from 'src/server/services/dataService/models'
import {LGNotAuthorizedError} from 'src/server/util/error'

import {ProjectSummary} from 'src/server/graphql/schemas'

export default {
  type: ProjectSummary,
  args: {
    memberId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The memberId of the member whose survey should be locked',
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The projects id of the survey to lock for this given member',
    },
  },
  async resolve(source, {memberId, projectId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new LGNotAuthorizedError()
    }

    await lockRetroSurveyForUser(memberId, projectId)
    return {
      project: await Project.get(projectId)
    }
  }
}
