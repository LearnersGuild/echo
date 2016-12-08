import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {getChapterById} from 'src/server/db/chapter'
import {getCycleById} from 'src/server/db/cycle'
import {getProjectById, getProjectByName} from 'src/server/db/project'
import {Survey} from 'src/server/services/dataService'
import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertPlayersCurrentCycleInState from 'src/server/actions/assertPlayersCurrentCycleInState'
import {BadInputError} from 'src/server/errors'
import {handleError} from 'src/server/graphql/util'

export async function resolveCycleChapter(cycle) {
  if (cycle.chapter) {
    return cycle.chapter
  }
  if (cycle.chapterId) {
    return await getChapterById(cycle.chapterId)
  }
}

export async function resolveProjectChapter(project) {
  if (project.chapter) {
    return project.chapter
  }
  if (project.chapterId) {
    return await getChapterById(project.chapterId)
  }
}

export async function resolveProjectCycle(project) {
  if (project.cycle) {
    return project.cycle
  }
  if (project.cycleId) {
    return await getCycleById(project.cycleId)
  }
}

export async function resolveSurveyProject(parent) {
  if (parent.project) {
    return parent.project
  }
  if (parent.projectId) {
    return await getProjectById(parent.projectId)
  }
}

export async function resolveSaveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  _assertUserAuthroized(currentUser, 'saveResponse')
  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

  return await _validateAndSaveResponses(responses, currentUser)
}

export async function resolveSaveProjectReviewCLISurveyResponses(source, {responses: namedResponses, projectName}, {rootValue: {currentUser}}) {
  _assertUserAuthroized(currentUser, 'saveResponse')
  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

  const responses = await _buildResponsesFromNamedResponses(namedResponses, projectName, currentUser.id)

  return await _validateAndSaveResponses(responses, currentUser)
}

function _assertUserAuthroized(user, action) {
  if (!user || !userCan(user, action)) {
    throw new GraphQLError('You are not authorized to do that.')
  }
}

async function _validateAndSaveResponses(responses, currentUser) {
  await _assertCurrentUserCanSubmitResponsesForRespodent(currentUser, responses)

  return await saveSurveyResponses({responses})
    .then(createdIds => ({createdIds}))
    .catch(err => handleError(err, 'Failed to save responses'))
}

function _assertCurrentUserCanSubmitResponsesForRespodent(currentUser, responses) {
  responses.forEach(response => {
    if (currentUser.id !== response.respondentId) {
      throw new BadInputError('You cannot submit responses for other players.')
    }
  })
}

async function _buildResponsesFromNamedResponses(namedResponses, projectName, respondentId) {
  const project = await getProjectByName(projectName)
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
