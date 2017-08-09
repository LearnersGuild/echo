import {GraphQLNonNull, GraphQLID} from 'graphql'
import unlockSurveyForMember from 'src/server/actions/unlockSurveyForMember'
import userCan from 'src/common/util/userCan'
import {LGNotAuthorizedError} from 'src/server/util/error'

import {ProjectSummary} from 'src/server/graphql/schemas'

export default {
  type: ProjectSummary,
  args: {
    surveyId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The ID of the survey to unlock for the member',
    },
    memberId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The ID of the member to unlock the survey for',
    },
  },
  async resolve(source, {surveyId, memberId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new LGNotAuthorizedError()
    }

    return unlockSurveyForMember(surveyId, memberId)
  }
}
