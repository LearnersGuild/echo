import {Project, Survey} from 'src/server/services/dataService'

export async function unlockRetroSurveyForUser(playerId, projectId) {
  const surveyId = await _getCompletedRetroId(playerId, projectId)

  await Survey.get(surveyId).update(s => ({
    unlockedFor: s('unlockedFor').default([]).add([playerId]).distinct()
  }))
}

export async function lockRetroSurveyForUser(playerId, projectId) {
  const surveyId = await _getCompletedRetroId(playerId, projectId)

  await Survey.get(surveyId).update(s => ({
    unlockedFor: s('unlockedFor').default([]).filter(id => id.ne(playerId))
  }))
}

async function _getCompletedRetroId(playerId, projectId) {
  const project = await Project.get(projectId).getJoin({retrospectiveSurvey: true})
  _assertSurveyIsCompleted(project.retrospectiveSurvey, playerId)
  return project.retrospectiveSurveyId
}

function _assertSurveyIsCompleted(survey, playerId) {
  if (!survey.completedBy.includes(playerId)) {
    throw new Error('Cannot toggle lock for an incomplete survey')
  }
}
