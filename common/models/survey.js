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

export const LIKERT_7_AGREEMENT_OPTIONS = [
  {value: 1, label: 'strongly disagree'},
  {value: 2, label: 'disagree'},
  {value: 3, label: 'somewhat disagree'},
  {value: 4, label: 'neutral'},
  {value: 5, label: 'somewhat agree'},
  {value: 6, label: 'agree'},
  {value: 7, label: 'strongly agree'},
  {value: 0, label: 'not enough information'},
]

export function renderQuestionBodies(surveyQuestions) {
  return surveyQuestions.map(q => {
    q.body = micromustache.render(q.body, {subject: `@${q.subjects[0].handle}`})
    return q
  })
}

export function groupSurveyQuestions(questions) {
  const teamQuestionGroups = new Map() // keyed by question ID
  const subjectQuestionGroups = new Map() // keyed by player ID

  let parseError
  if (Array.isArray(questions)) {
    questions.forEach(question => {
      let subject
      let subjectQuestionGroup

      switch (question.subjectType) {
        case SURVEY_QUESTION_SUBJECT_TYPES.TEAM:
          teamQuestionGroups.set(question.id, [question])
          break

        case SURVEY_QUESTION_SUBJECT_TYPES.PLAYER:
          subject = question.subjects ? question.subjects[0] : null

          if (subject) {
            subjectQuestionGroup = subjectQuestionGroups.get(subject.id)
            if (!subjectQuestionGroup) {
              subjectQuestionGroup = []
              subjectQuestionGroups.set(subject.id, subjectQuestionGroup)
            }
            subjectQuestionGroup.push(question)
          } else {
            parseError = new Error(`Subject not found for question ${question.id}`)
          }
          break

        default:
          parseError = new Error(`Invalid survey question subject type ${question.subjectType}; question skipped`)
      }
    })
  } else {
    parseError = new Error('Invalid questions value; cannot convert to question groups')
  }

  if (parseError) {
    console.error(parseError)
  }

  const teamGroups = Array.from(teamQuestionGroups.values())
  const subjectGroups = Array.from(subjectQuestionGroups.values())
  const result = teamGroups.concat(subjectGroups)
  return result
}
