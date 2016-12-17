import {connect} from 'src/db'
import {getStatByDescriptor} from 'src/server/db/stat'
import {replaceInTable} from 'src/server/db/util'

const r = connect()
export const questionsTable = r.table('questions')

export function getQuestionById(id) {
  return questionsTable.get(id)
}

export function getActiveQuestionsByIds(ids) {
  return questionsTable.getAll(...ids).filter({active: true})
}

export function findQuestionsByIds(ids) {
  return questionsTable.getAll(...ids)
}

export function saveQuestions(questions, options) {
  return Promise.all(questions.map(question =>
    replaceInTable(question, questionsTable, options)
  ))
}

export function saveQuestion(question, options) {
  return replaceInTable(question, questionsTable, options)
}

export function findQuestionsByStat(statDescriptor) {
  return questionsTable.filter({
    statId: getStatByDescriptor(statDescriptor)('id')
  })
}

export async function getRelativeContributionQuestionForSurvey(survey) {
  const rcQuestions = await r.expr(survey)('questionRefs')('questionId')
    .do(questionIds => questionsTable.getAll(r.args(questionIds)))
    .filter({responseType: 'relativeContribution', active: true})

  if (rcQuestions.length === 0) {
    throw new Error(`No Relative Contribution Question Found on this survey [${survey.id}]!`)
  }

  if (rcQuestions.length > 1) {
    throw new Error(`Multiple Relative Contribution Questions Found on this survey [${survey.id}]!`)
  }
  return rcQuestions[0]
}
