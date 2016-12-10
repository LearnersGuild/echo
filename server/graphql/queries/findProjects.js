import {GraphQLString} from 'graphql'
import {GraphQLError} from 'graphql/error'
import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import {findProjects, findProjectsByIds} from 'src/server/db/project'
import {Project} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLList(Project),
  args: {
    identifiers: {type: new GraphQLList(GraphQLString), description: 'A list of project identifiers'},
  },
  async resolve(source, args = {}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'listProjects')) {
      throw new GraphQLError('You are not authorized to do that')
    }

    return args.identifiers ?
      await findProjectsByIds(args.identifiers) :
      await findProjects()
  },
}
