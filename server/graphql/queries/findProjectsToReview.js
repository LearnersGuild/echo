import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import getUser from 'src/server/actions/getUser'

import {userCan} from 'src/common/util'
import {findProjectsToReview} from 'src/server/actions/findProjectsToReview'
import {Project} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Project),
  args: {
    playerId: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args = {}) {
    const currentPlayer = await getUser(args.playerId)
    if (!userCan(currentPlayer, 'findProjectsToReview')) {
      throw new LGNotAuthorizedError()
    }

    return await findProjectsToReview(args.playerId)
  },
}
