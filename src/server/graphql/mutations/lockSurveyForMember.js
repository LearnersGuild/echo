import {GraphQLNonNull, GraphQLID} from 'graphql'
import lockSurveyForMember from 'src/server/actions/lockSurveyForMember'
import userCan from 'src/common/util/userCan'
import {LGNotAuthorizedError} from 'src/server/util/error'

import {ProjectSummary} from 'src/server/graphql/schemas'

export default {
  type: ProjectSummary,
  args: {
    surveyId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The ID of the survey to lock for the member',
    },
    memberId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The ID of the member to lock the survey for',
    },
  },
  async resolve(source, {surveyId, memberId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new LGNotAuthorizedError()
    }

    return lockSurveyForMember(surveyId, memberId)
  }
}
