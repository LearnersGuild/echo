import micromustache from 'micromustache'

export function renderQuestionBodies(surveyQuestions) {
  return surveyQuestions.map(q => {
    q.body = micromustache.render(q.body, {subject: `@${q.subjects[0].handle}`})
    return q
  })
}
