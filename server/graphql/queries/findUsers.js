import {GraphQLString} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import findUsers from 'src/server/actions/findUsers'
import {UserProfile} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLList(UserProfile),
  args: {
    identifiers: {type: new GraphQLList(GraphQLString)},
  },
  async resolve(source, {identifiers}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'listUsers')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    return await findUsers(identifiers, {skipNoMatch: true})
  }
}
