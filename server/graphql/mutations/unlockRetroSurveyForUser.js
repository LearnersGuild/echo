import {GraphQLNonNull, GraphQLID, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {unlockRetroSurveyForUser} from 'src/server/actions/unlockRetroSurveyForUser'
import userCan from 'src/common/util/userCan'

import {Survey} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLObjectType({
    name: 'Result',
    fields: {
      success: {type: GraphQLBoolean}
    }
  }),
  args: {
    playerId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'blah',
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'blah',
    },
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    console.log(args)
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new GraphQLError('You are not authorized to do that')
    }

    await unlockRetroSurveyForUser(args.playerId, args.projectId)
    return {success: true}
  }
}
