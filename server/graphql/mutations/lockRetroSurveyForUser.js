import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'
import {lockRetroSurveyForUser} from 'src/server/actions/unlockRetroSurveyForUser'
import userCan from 'src/common/util/userCan'

import {BooleanSuccess} from 'src/server/graphql/schemas'

export default {
  type: BooleanSuccess,
  args: {
    playerId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The playerId of the player whose survey should be locked',
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The projects id of the survey to lock for this given player',
    },
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new GraphQLError('You are not authorized to do that')
    }

    await lockRetroSurveyForUser(args.playerId, args.projectId)
    return {success: true}
  }
}

