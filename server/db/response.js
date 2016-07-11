import r from '../../db/connect'
import {insertAllIntoTable, updateAllInTable} from '../../server/db/util'

export const responsesTable = r.table('responses')

export function getResponseById(id) {
  return responsesTable.get(id)
}

export function getSurveyResponsesForPlayer(respondentId, surveyId, questionId) {
  return responsesTable.getAll([
    questionId,
    respondentId,
    surveyId
  ], {index: 'questionIdAndRespondentIdAndSurveyId'})
}

export function getSurveyResponses(surveyId, questionId) {
  return responsesTable.between(
    [questionId, r.minval, surveyId],
    [questionId, r.maxval, surveyId],
    {index: 'questionIdAndRespondentIdAndSurveyId'}
  )
}

export async function saveResponsesForSurveyQuestion(newResponses) {
  const {questionId, respondentId, surveyId} = newResponses[0]
  const subjectIds = newResponses.map(response => response.subjectId)

  const existingResponses = await getSurveyResponsesForPlayer(respondentId, surveyId, questionId)
    .filter(row => r.expr(subjectIds).contains(row('subjectId'))).run()

  const responsesToUpdate = existingResponses.map(existingResponse => {
    const responseToUpdate = newResponses.find(response => response.subjectId === existingResponse.subjectId)
    return Object.assign({}, responseToUpdate, {id: existingResponse.id, updatedAt: r.now()})
  })

  await updateAll(responsesToUpdate)

  const responsesToInsert = newResponses
    .filter(update => !existingResponses.find(existing => existing.subjectId === update.subjectId))
    .map(response => Object.assign({}, response, {createdAt: r.now(), updatedAt: r.now()}))

  /* eslint-disable camelcase */
  const {generated_keys} = await insert(responsesToInsert)
  const responseIds = existingResponses.map(({id}) => id).concat(generated_keys || [])
  /* eslint-enable camelcase */

  return responseIds
}

function insert(responses) {
  return insertAllIntoTable(responses, responsesTable)
}

function updateAll(responses) {
  return updateAllInTable(responses, responsesTable)
}
