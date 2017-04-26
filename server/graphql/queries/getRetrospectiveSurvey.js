import {GraphQLString} from 'graphql'

import {userCan} from 'src/common/util'
import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Project} from 'src/server/services/dataService'
import {Survey} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadRequestError} from 'src/server/util/error'

export default {
  type: Survey,
  args: {
    projectName: {
      type: GraphQLString,
      description: 'The name of the project whose retrospective survey should be returned. Required if the current user is in more than one project this cycle.'
    }
  },
  async resolve(source, {projectName}, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
      throw new LGNotAuthorizedError()
    }
    const project = projectName ? (await Project.filter({name: projectName}))[0] : null
    const projectId = project ? project.id : null
    const artifactURL = project ? project.artifactURL : 'no project specified'

    if (!artifactURL) {
      throw new LGBadRequestError(`You cannot fill out a retro for ${projectName} until the project artifact is set.`)
    }

    return compileSurveyDataForPlayer(currentUser.id, projectId)
  },
}
