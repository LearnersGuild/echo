import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLURL} from 'graphql-custom-types'
import {GraphQLError} from 'graphql/error'

import {handleError} from '../../../../server/graphql/models/util'
import {userCan} from '../../../../common/util'
import {update as updateProject, findProjectByNameForPlayer} from '../../../db/project'

import {Project} from './schema'

export default {
  setProjectArtifactURL: {
    type: Project,
    args: {
      projectName: {type: new GraphQLNonNull(GraphQLString)},
      url: {type: new GraphQLNonNull(GraphQLURL)},
    },
    async resolve(source, {projectName, url}, {rootValue: {currentUser}}) {
      if (!userCan(currentUser, 'updateProject')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        const project = await findProjectByNameForPlayer(projectName, currentUser.id)
        project.artifactURL = url
        const result = await updateProject(project, {returnChanges: true})
        if (result.replaced) {
          return result.changes[0].new_val
        }
        throw new GraphQLError('Failed to update project artifactURL')
      } catch (err) {
        handleError(err)
      }
    }
  },
}
