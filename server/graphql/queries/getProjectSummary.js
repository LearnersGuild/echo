import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {getProject} from 'src/server/db/project'
import {ProjectSummary} from 'src/server/graphql/schemas'

export default {
  type: ProjectSummary,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'Project id or name'},
  },
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'viewProjectSummary')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const project = await getProject(identifier)
    if (!project) {
      throw new GraphQLError(`Project not found for identifier ${identifier}`)
    }

    return {project}
  }
}
