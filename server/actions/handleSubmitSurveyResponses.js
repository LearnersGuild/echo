import Promise from 'bluebird'

import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertCycleInState from 'src/server/actions/assertCycleInState'
import {CYCLE_REFLECTION_STATES} from 'src/common/models/cycle'
import {Cycle, Project} from 'src/server/services/dataService'
import {handleError} from 'src/server/graphql/util'
import {LGBadInputError} from 'src/server/util/error'
import {connect} from 'src/db'
import {mapById, unique} from 'src/server/util'

const r = connect()

export default async function handleSubmitSurveyResponses(responses) {
  if (!Array.isArray(responses) || responses.length === 0) {
    throw new LGBadInputError('Responses must be a non-empty array')
  }
  return _validateAndSaveResponses(responses) // saved response IDs
}

async function _validateAndSaveResponses(responses) {
  await _assertResponsesAreAllowedForProjects(responses)
  return await saveSurveyResponses({responses})
    .then(createdIds => ({createdIds}))
    .catch(err => handleError(err, 'Failed to save responses'))
}

async function _assertResponsesAreAllowedForProjects(responses) {
  const projects = await _getProjectsFromResponseSurveys(responses)
  const cycleIds = unique(projects.map(p => p.cycleId))
  const responseCycles = await Cycle.getAll(...cycleIds)
  await Promise.each(responseCycles, cycle => assertCycleInState(cycle, CYCLE_REFLECTION_STATES))
}

async function _getProjectsFromResponseSurveys(responses) {
  const responsesBySurveyId = mapById(responses, 'surveyId')
  const surveyIds = Array.from(responsesBySurveyId.keys())
  return Project.filter(project => r.or(
    r.expr(surveyIds).contains(project('retrospectiveSurveyId').default('')),
    r.expr(surveyIds).contains(project('projectReviewSurveyId').default('')),
  ))
}
