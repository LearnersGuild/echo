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

export function groupSurveyQuestions(questions) {
  const teamQuestionGroups = new Map() // keyed by question ID
  const subjectQuestionGroups = new Map() // keyed by player ID

  let parseError
  if (Array.isArray(questions)) {
    questions.forEach(question => {
      let subject
      let subjectQuestionGroup

      switch (question.responseType) {
        case SURVEY_QUESTION_SUBJECT_TYPES.TEAM:
          teamQuestionGroups.set(question.id, {
            questions: _createQuestionGroup([question])
          })
          break

        case SURVEY_QUESTION_SUBJECT_TYPES.PLAYER:
          subject = question.subjects ? question.subjects[0] : null

          if (subject) {
            subjectQuestionGroup = subjectQuestionGroups.get(subject.id)
            if (!subjectQuestionGroup) {
              subjectQuestionGroup = _createQuestionGroup()
              subjectQuestionGroups.set(subject.id, subjectQuestionGroup)
            }
            subjectQuestionGroup.questions.push(question)
          } else {
            parseError = new Error(`Subject not found for player question ${question.id}`)
          }
          break

        default:
          parseError = new Error(`Invalid survey question subject type ${question.responseType}; question skipped`)
      }
    })
  } else {
    parseError = new Error('Invalid questions array; cannot convert to question groups')
  }

  if (parseError) {
    console.error(parseError)
  }

  return Array.from(teamQuestionGroups.values()).concat(Array.from(subjectQuestionGroups.values()))
}

function _createQuestionGroup(questions) {
  return {
    answered: false,
    questions: questions || []
  }
}
