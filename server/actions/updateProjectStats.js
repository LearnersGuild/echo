import {getSurveyById} from '../../server/db/survey'
import {getRelativeContributionQuestionForSurvey} from '../../server/db/question'
import {getSurveyResponses} from '../../server/db/response'
import {savePlayerProjectStats} from '../../server/db/player'
import {
  getProjectHistoryForCycle,
} from '../../server/db/project'

export async function updateProjectStats(project, cycleId) {
  const projectCycle = getProjectHistoryForCycle(project, cycleId)
  const teamSize = projectCycle.playerIds.length
  const surveyId = projectCycle.retrospectiveSurveyId
  const survey = await getSurveyById(surveyId)
  const {id: questionId} = await getRelativeContributionQuestionForSurvey(survey)
  const responsesBySubjectId = await getResponsesBySubjectId(surveyId, questionId)

  const promises = []
  responsesBySubjectId.forEach((responses, subjectPlayerId) => {
    const relativeContributionScores = responses.map(({value}) => value)
    const subjectPlayerStats = calculatePlayerProjectStats({teamSize, relativeContributionScores})
    promises.push(savePlayerProjectStats(subjectPlayerId, project.id, cycleId, subjectPlayerStats))
  })

  await Promise.all(promises)
}

export function calculatePlayerProjectStats({buildCycles, teamSize, relativeContributionScores}) {
  // Calculate ABC
  const aggregateBuildCycles = (buildCycles || 1) * teamSize

  // Calculate RC
  const sum = relativeContributionScores.reduce((sum, next) => sum + next, 0)
  const relativeContribution = Math.round(sum / relativeContributionScores.length)

  // Calculate ECC
  const effectiveContributionCycles = relativeContribution * aggregateBuildCycles

  return {
    ecc: effectiveContributionCycles,
    abc: aggregateBuildCycles,
    rc: relativeContribution,
  }
}

async function getResponsesBySubjectId(surveyId, questionId) {
  const responses = await getSurveyResponses(surveyId, questionId)

  const responsesBySubjectId = responses.reduce((result, response) => {
    const current = result.get(response.subjectId) || []
    result.set(response.subjectId, current.concat(response))
    return result
  }, new Map())

  return responsesBySubjectId
}
