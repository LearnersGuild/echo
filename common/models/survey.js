import micromustache from 'micromustache'

export const QUESTION_SUBJECT_TYPES = {
  TEAM: 'team',
  PLAYER: 'player',
  SINGLE: 'single', // TODO: this isn't really a subjectType =/
  PROJECT: 'project',
}

export const QUESTION_RESPONSE_TYPES = {
  TEXT: 'text',
  LIKERT_7: 'likert7Agreement',
  RELATIVE_CONTRIBUTION: 'relativeContribution',
  NUMERIC: 'numeric',
}

export const LIKERT_7_AGREEMENT_OPTIONS = [
  {value: 7, label: 'strongly agree'},
  {value: 6, label: 'agree'},
  {value: 5, label: 'somewhat agree'},
  {value: 4, label: 'neutral'},
  {value: 3, label: 'somewhat disagree'},
  {value: 2, label: 'disagree'},
  {value: 1, label: 'strongly disagree'},
  {value: 0, label: 'not enough information'},
]

export function renderQuestionBodies(surveyQuestions) {
  return surveyQuestions.map(q => {
    q.body = micromustache.render(q.body, {subject: `@${q.subjects[0].handle}`})
    return q
  })
}

export function surveyProgress(fullSurveyForPlayer) {
  const responseCount = fullSurveyForPlayer.questions
    .map(q => q.response.values)
    .reduce((count, responseValues) => count + responseValues.length, 0)

  const subjectCount = fullSurveyForPlayer.questions
    .map(q => q.subjectIds)
    .reduce((count, ids) => count + ids.length, 0)

  return {
    completed: responseCount === subjectCount,
    responseCount,
    subjectCount,
  }
}

export function surveyLockedFor(survey, playerId) {
  if (!surveyCompletedBy(survey, playerId)) {
    return null
  }

  return !(survey.unlockedFor || []).includes(playerId)
}

export function surveyCompletedBy(survey, playerId) {
  return (survey.completedBy || []).includes(playerId)
}
