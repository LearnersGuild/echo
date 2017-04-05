import {GraphQLNonNull, GraphQLString} from 'graphql'

import deleteProject from 'src/server/actions/deleteProject'
import {userCan} from 'src/common/util'
import {Status} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: Status,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'The project ID or name'}
  },
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'deleteProject')) {
      throw new LGNotAuthorizedError('You are not authorized to delete projects.')
    }

    await deleteProject(identifier)
    return {success: true}
  }
}
