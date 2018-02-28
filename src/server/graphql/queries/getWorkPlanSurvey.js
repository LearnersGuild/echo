import {GraphQLString} from 'graphql'

import {userCan} from 'src/common/util'
import {compileSurveyDataForMember} from 'src/server/actions/compileSurveyData'
import {Project} from 'src/server/services/dataService'
import {Survey} from 'src/server/graphql/schemas'
import {LGError, LGNotAuthorizedError} from 'src/server/util/error'
import {WORK_PLAN_DESCRIPTOR} from 'src/common/models/surveyBlueprint'

export default {
  type: Survey,
  args: {
    projectName: {
      type: GraphQLString,
      description: 'The name of the project whose work plan survey should be returned. Required if the current user is in more than one project this cycle.'
    }
  },
  async resolve(source, {projectName}, {currentUser}) {
    if (!currentUser || !userCan(currentUser, 'getWorkPlanSurvey')) {
      throw new LGNotAuthorizedError()
    }
    const project = projectName ? (await Project.filter({name: projectName}))[0] : null
    const projectId = project ? project.id : null

    if (!project) {
      throw new LGError(`${projectName} is not a valid project name`)
    }

    return compileSurveyDataForMember(currentUser.id, projectId, WORK_PLAN_DESCRIPTOR)
  },
}
