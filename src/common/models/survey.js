import micromustache from 'micromustache'

export const QUESTION_SUBJECT_TYPES = {
  COACH: 'coach', /* FIXME: only being kept because of an unnecessarry migration. */ // eslint-disable-line no-warning-comments
  TEAM: 'team',
  MEMBER: 'member',
  PROJECT: 'project',
}

export const QUESTION_RESPONSE_TYPES = {
  TEXT: 'text',
  LIKERT_7: 'likert7Agreement',
  RELATIVE_CONTRIBUTION: 'relativeContribution',
  NUMERIC: 'numeric',
  PERCENTAGE: 'percentage',
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

export function surveyProgress(fullSurveyForMember) {
  const responseCount = fullSurveyForMember.questions
    .map(q => q.response.values)
    .reduce((count, responseValues) => count + responseValues.length, 0)

  const subjectCount = fullSurveyForMember.questions
    .map(q => q.subjectIds)
    .reduce((count, ids) => count + ids.length, 0)

  return {
    completed: responseCount === subjectCount,
    responseCount,
    subjectCount,
  }
}

export function surveyLockedFor(survey, memberId) {
  return !(survey.unlockedFor || []).includes(memberId)
}

export function surveyCompletedBy(survey, memberId) {
  return (survey.completedBy || []).includes(memberId)
}
