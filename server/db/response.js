import {connect} from 'src/db'
import {insertAllIntoTable, updateAllInTable} from 'src/server/db/util'
import {surveysTable} from 'src/server/db/survey'
import {table as projectsTable} from 'src/server/db/project'

const r = connect()
export const responsesTable = r.table('responses')

export function getResponseById(id) {
  return responsesTable.get(id)
}

export function findResponsesBySurveyId(surveyId) {
  return responsesTable.getAll(surveyId, {index: 'surveyId'})
}

export function getSurveyResponsesForPlayer(respondentId, surveyId, questionId, subjectIds) {
  const responseExpr = responsesTable.getAll([
    questionId,
    respondentId,
    surveyId
  ], {index: 'questionIdAndRespondentIdAndSurveyId'})

  if (subjectIds) {
    return responseExpr.filter(response => subjectIds.contains(response('subjectId')))
  }

  return responseExpr
}

export function getSurveyResponses(surveyId, questionId) {
  return responsesTable.filter({questionId, surveyId})
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

export function insert(responses) {
  return insertAllIntoTable(responses, responsesTable)
}

function updateAll(responses) {
  return updateAllInTable(responses, responsesTable)
}

export function findProjectReviewsForPlayer(playerId, projects = projectsTable) {
  const getResponseListForSurvey = surveyInfo => {
    return surveyInfo('questionRefs')
      .concatMap(questionRef => {
        return responsesTable
          .getAll(
            [questionRef('questionId'), playerId, surveyInfo('surveyId')],
            {index: 'questionIdAndRespondentIdAndSurveyId'}
          )
          .map(response => ({
            projectId: surveyInfo('projectId'),
            projectName: surveyInfo('projectName'),
            surveyId: surveyInfo('surveyId'),
            name: questionRef('name'),
            value: response('value'),
          }))
      })
  }
  const reviewIsComplete = review => review.count().eq(1)

  return projects
    .hasFields('projectReviewSurveyId')
    .map(project => ({
      projectId: project('id'),
      projectName: project('name'),
      projectReviewSurvey: surveysTable.get(project('projectReviewSurveyId'))
    }))
    .map(projectWithSurvey => ({
      projectId: projectWithSurvey('projectId'),
      projectName: projectWithSurvey('projectName'),
      surveyId: projectWithSurvey('projectReviewSurvey')('id'),
      questionRefs: projectWithSurvey('projectReviewSurvey')('questionRefs')
    }))
    .map(getResponseListForSurvey)
    .filter(reviewIsComplete)
    .map(reviewResponses =>
      r.object(
        'projectId', reviewResponses.nth(0)('projectId'),
        'projectName', reviewResponses.nth(0)('projectName'),
        reviewResponses.nth(0)('name'), reviewResponses.nth(0)('value'),
      )
    )
}
