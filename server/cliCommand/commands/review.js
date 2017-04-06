import {PROJECT_STATES} from 'src/common/models/project'
import {surveyProgress} from 'src/common/models/survey'
import {userCan} from 'src/common/util'

import handleCompleteSurvey from 'src/server/actions/handleCompleteSurvey'
import handleSubmitSurveyResponses from 'src/server/actions/handleSubmitSurveyResponses'
import {getProjectByName} from 'src/server/db/project'
import {getFullSurveyForPlayerById} from 'src/server/db/survey'
import {Survey} from 'src/server/services/dataService'
import {LGCLIUsageError, LGBadRequestError, LGNotAuthorizedError} from 'src/server/util/error'

export async function _saveReview(user, projectName, namedResponses) {
  if (!user || !userCan(user, 'saveResponse')) {
    throw new LGNotAuthorizedError()
  }

  const project = await getProjectByName(projectName)
  _assertIsExternalReview(user, project)
  _assertProjectIsInState(project, [PROJECT_STATES.REVIEW])

  const responses = await _buildResponsesFromNamedResponses(namedResponses, project, user.id)
  await _assertCurrentUserCanSubmitResponsesForRespondent(user, responses)

  const savedResponseIds = await handleSubmitSurveyResponses(responses)
  const projectReviewSurveyId = responses[0].surveyId

  // unlike with the retro survey, project review responses submitted via the CLI
  // are checked to automatically trigger survey completion handling
  const fullSurvey = await getFullSurveyForPlayerById(user.id, projectReviewSurveyId)
  if (surveyProgress(fullSurvey).completed) {
    await handleCompleteSurvey(projectReviewSurveyId, user.id)
  }

  return savedResponseIds
}

async function _buildResponsesFromNamedResponses(namedResponses, project, respondentId) {
  const survey = await Survey.get(project.projectReviewSurveyId)

  return namedResponses.map(namedResponse => {
    const {questionName, responseParams} = namedResponse
    const {questionId, subjectIds} = survey.questionRefs.find(ref => ref.name === questionName) || {}
    return {
      respondentId,
      questionId,
      surveyId: survey.id,
      values: [{subjectId: subjectIds[0], value: responseParams[0]}]
    }
  })
}

function _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses) {
  responses.forEach(response => {
    if (currentUser.id !== response.respondentId) {
      throw new LGBadRequestError('You cannot submit responses for other players.')
    }
  })
}

function _assertIsExternalReview(currentUser, project) {
  if (project.playerIds.includes(currentUser.id)) {
    throw new LGBadRequestError(`Whoops! You are on team #${project.name}. To review your own project, use the /retro command.`)
  }
}

function _assertProjectIsInState(project, targetStates) {
  if (!targetStates.includes(project.state)) {
    throw new LGBadRequestError(`The ${project.name} project is closed and can no longer be reviewed.`)
  }
}

export async function invoke(args, {user}) {
  if (args._.length < 2) {
    throw new LGCLIUsageError()
  }

  const [projectNameOrChannel, score] = args._
  const projectName = projectNameOrChannel.replace(/^#/, '')
  const responses = [{questionName: 'completeness', responseParams: [score]}]
  await _saveReview(user, projectName, responses)

  return {
    text: `Completeness score captured for ${projectName}. Review is complete. Thanks for your input.`
  }
}
