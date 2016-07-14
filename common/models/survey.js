import micromustache from 'micromustache'

export const SURVEY_QUESTION_SUBJECT_TYPES = {
  TEAM: 'team',
  PLAYER: 'player',
}

export const SURVEY_QUESTION_RESPONSE_TYPES = {
  TEXT: 'text',
  LIKERT_7: 'likert7Agreement',
  RELATIVE_CONTRIBUTION: 'relativeContribution',
}

export function renderQuestionBodies(surveyQuestions) {
  return surveyQuestions.map(q => {
    q.body = micromustache.render(q.body, {subject: `@${q.subjects[0].handle}`})
    return q
  })
}
