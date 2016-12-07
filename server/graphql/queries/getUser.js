import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import getUser from 'src/server/actions/getUser'
import {UserProfile} from 'src/server/graphql/schemas'

export default {
  type: UserProfile,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'The user ID or handle'},
  },
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'viewUser')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const user = await getUser(identifier)
    if (!user) {
      throw new GraphQLError(`User not found for identifier ${identifier}`)
    }

    return user
  }
}
