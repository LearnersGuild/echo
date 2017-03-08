import {GraphQLID} from 'graphql'
import {GraphQLError} from 'GraphQL/error'

import {userCan} from 'src/common/util'
import {deleteProjectById} from 'src/server/db/project'
import {Project} from 'src/server/graphql/schemas'

export default {
  type: Project,
  args: {
    projectId: {type: GraphQLID},
  },
  async resolve(source, {projectId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'deleteProject')) {
      throw new GraphQLError('You are not authorized to delete projects.')
    }

    const deletedProject = await deleteProjectById(projectId)
    if (!deletedProject.deleted) {
      throw new GraphQLError('A project with that id does not exist.')
    }

    return deletedProject.changes[0].old_val
  }
}
