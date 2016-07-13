import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import r from '../../db/connect'

import {REFLECTION} from '../../common/models/cycle'
import {RETROSPECTIVE_DESCRIPTOR, PROJECT_REVIEW_DESCRIPTOR} from '../../common/models/surveyBlueprint'
import {findCycles} from '../../server/db/cycle'
import {updateInTable, insertIntoTable} from '../../server/db/util'
import {getPlayerById} from './player'
import {getQuestionById} from './question'
import {
  getProjectById,
  getProjectHistoryForCycle,
  findProjectByPlayerIdAndCycleId,
  getLatestCycleId,
  getTeamPlayerIds,
} from './project'
import {responsesTable, getSurveyResponsesForPlayer} from './response'
import {customQueryError} from './errors'

export const surveysTable = r.table('surveys')

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey)
  }
  return insert(survey)
}

export function getRetrospectiveSurveyForPlayer(playerId, projectId) {
  let survey

  if (!projectId) {
    survey = getCurrentCycleIdAndProjectIdInStateForPlayer(playerId, REFLECTION).do(
      ids => getProjectRetroSurvey(ids('projectId'), ids('cycleId'))
        .merge({cycleId: ids('cycleId'), projectId: ids('projectId')})
    )
  } else {
    survey = getProjectById(projectId).do(project => {
      const cycleId = getLatestCycleId(project)
      return r.branch(
        getTeamPlayerIds(project, cycleId).contains(playerId),
        getProjectRetroSurvey(projectId, cycleId),
        customQueryError('Player not on the team for that project this cycle'),
      )
    })
  }

  return excludePlayerQuestionsAboutRespondent(survey, playerId)
}

function excludePlayerQuestionsAboutRespondent(surveyQuery, respondentId) {
  const questionRefIsAboutRespondent = ref => r.and(
    ref('subjectIds').count().eq(1),
    ref('subjectIds').nth(0).eq(respondentId)
  )

  const filteredQuestionRefs = row => row('questionRefs').filter(
    ref => r.not(questionRefIsAboutRespondent(ref))
  )

  return surveyQuery.merge(row => ({
    questionRefs: filteredQuestionRefs(row)
  }))
}

function getCurrentCycleIdAndProjectIdInStateForPlayer(playerId, state) {
  const cycle = findCycles({
    state,
    chapterId: getPlayerById(playerId)('chapterId'),
  }).nth(0).default(customQueryError(`There is no cycle in the ${state} state for this chapter`))

  return cycle.do(
    cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id'))
      .pluck('id')
      .merge(project => ({projectId: project('id'), cycleId: cycle('id')}))
      .without('id')
  )
}

export function getFullRetrospectiveSurveyForPlayer(playerId, projectId) {
  const surveyQuery = getRetrospectiveSurveyForPlayer(playerId, projectId)
  return inflateQuestionRefs(playerId, surveyQuery)
}

export function inflateQuestionRefs(playerId, surveyQuery) {
  return surveyQuery.merge(survey => ({
    questions: mapRefsToQuestions(survey, playerId)
  }))
}

let SURVEY_RESPONSE_INSTRUCTIONS
function getResponseInstructionsByType(type) {
  if (!SURVEY_RESPONSE_INSTRUCTIONS) {
    const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', 'survey-response-instructions.yaml')
    const data = fs.readFileSync(dataFilename).toString()
    SURVEY_RESPONSE_INSTRUCTIONS = yaml.parse(data)
  }
  return r.expr(SURVEY_RESPONSE_INSTRUCTIONS)(type)
}

function mapRefsToQuestions(survey, playerId) {
  return survey('questionRefs').map(ref =>
    getQuestionById(ref('questionId'))
      .merge(question => ({
        subjectIds: ref('subjectIds'),
        name: ref('name').default(null),
        responseIntructions: getResponseInstructionsByType(question('responseType')),
        response: getResponse(playerId, survey('id'), ref),
      }))
  )
}

function getResponse(playerId, surveyId, questionRef) {
  const responseQuery = getSurveyResponsesForPlayer(
    playerId,
    surveyId,
    questionRef('questionId')
  )
  const subjectPosition = response => questionRef('subjectIds').offsetsOf(response('subjectIds'))

  const responseValueList = responseQuery
    .orderBy(subjectPosition)
    .map(response => ({
      subjectId: response('subjectId'),
      value: response('value'),
    }))
    .coerceTo('array')

  return {values: responseValueList}
}

export function getProjectSurvey(projectId, cycleId, surveyDescriptor) {
  return getProjectById(projectId)
    .do(project => getProjectHistoryForCycle(project, cycleId)(`${surveyDescriptor}SurveyId`))
    .do(getSurveyById)
    .default(
      customQueryError(`There is no ${surveyDescriptor} survey for this project and cycle`)
    )
}

export function getProjectReviewSurvey(projectId, cycleId) {
  return getProjectSurvey(projectId, cycleId, PROJECT_REVIEW_DESCRIPTOR)
}

export function getProjectRetroSurvey(projectId, cycleId) {
  return getProjectSurvey(projectId, cycleId, RETROSPECTIVE_DESCRIPTOR)
}

export function update(survey, options) {
  return updateInTable(survey, surveysTable, options)
}

function insert(survey, options) {
  return insertIntoTable(survey, surveysTable, options)
}

export function getSurveyById(id) {
  return surveysTable.get(id)
}

export function getSurveyStats(surveyId) {
  const query = getSurveyById(surveyId)
  return mergeSurveyStats(query)
}

export function mergeSurveyStats(queryWithQuestionRefsAndSurveyId) {
  let query = mergeSubjectCount(queryWithQuestionRefsAndSurveyId)
  query = mergeProgress(query)
  return query
}

export function surveyWasCompletedBy(surveyId, respondentId) {
  return getSurveyById(surveyId)
    .do(mergeSurveyStats)
    .then(result => {
      const respondentProgress = result.progress.find(progressItem => respondentId === progressItem.respondentId)
      return respondentProgress && respondentProgress.completed
    })
}

export function recordSurveyCompletedBy(surveyId, respondentId) {
  const currentCompletedBy = r.row('completedBy').default([])
  const newCompletedBy = currentCompletedBy.setInsert(respondentId)
  const newUpdatedAt = r.branch(
    newCompletedBy.eq(currentCompletedBy),
    r.row('updatedAt'),
    r.now()
  )
  return update({
    id: surveyId,
    completedBy: newCompletedBy,
    updatedAt: newUpdatedAt
  }, {returnChanges: true})
}

function mergeProgress(queryWithSurveyId) {
  const surveyId = row => row('surveyId').default(row('id'))

  return queryWithSurveyId.merge(row => ({
    progress: responsesTable
      // 1. Get all the responses for this survey
      .filter({surveyId: surveyId(row)})
      // 2. Get a count of responses by respondentId like:
      // [
      //   {group: $id1, reduction: 5},
      //   {group: $id2, reduction: 2},
      //   ...
      // ]
      .group('respondentId').count().ungroup()
      // 3. Rename 'group' and 'reduction' and add a 'completed' field
      //    that's true if there's a response for every subject.
      .map(group => ({
        respondentId: group('group'),
        responseCount: group('reduction'),
        completed: group('reduction').eq(row('subjectCount')),
      }))
  }))
}

function mergeSubjectCount(queryWithQuestionRefs) {
  return queryWithQuestionRefs.merge(row => ({
    subjectCount: row('questionRefs').map(
      ref => ref('subjectIds').count()
    )
  }))
  .merge(row => ({
    subjectCount: row('subjectCount').sum()
  }))
}
