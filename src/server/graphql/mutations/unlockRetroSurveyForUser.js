import {GraphQLNonNull, GraphQLID} from 'graphql'
import {unlockRetroSurveyForUser} from 'src/server/actions/retroSurveyLockUnlock'
import userCan from 'src/common/util/userCan'
import Models from 'src/server/services/dataService/models'
import {LGNotAuthorizedError} from 'src/server/util/error'

import {ProjectSummary} from 'src/server/graphql/schemas'

const {Project} = Models

export default {
  type: ProjectSummary,
  args: {
    memberId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The memberId of the member whose survey should be unlocked',
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The projects id of the survey to unlock for this given member',
    },
  },
  async resolve(source, {memberId, projectId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new LGNotAuthorizedError()
    }

    await unlockRetroSurveyForUser(memberId, projectId)
    return {
      project: await Project.get(projectId)
    }
  }
}
