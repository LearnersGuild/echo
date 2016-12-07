import {connect} from 'src/db'
import {REFLECTION, PRACTICE} from 'src/common/models/cycle'
import {getLatestCycleForChapter} from './cycle'
import {getSurveyById} from './survey'
import {getSurveyResponsesForPlayer} from './response'
import {customQueryError} from './errors'
import {insertAllIntoTable, updateInTable} from './util'

const r = connect()
export const table = r.table('projects')

export function getProjectById(id) {
  return table.get(id)
}

export function getProjectByName(name) {
  return table.getAll(name, {index: 'name'})
    .nth(0)
    .default(customQueryError('No project found with that name'))
}

export function getProject(identifier) {
  const identifierLower = String(identifier).toLowerCase()
  return table.filter(row => r.or(
    row('id').eq(identifier),
    row('name').downcase().eq(identifierLower)
  ))
  .nth(0)
  .default(null)
}

export function getProjectsForChapter(chapterId) {
  return table.getAll(chapterId, {index: 'chapterId'})
}

export function findProjectsForUser(userId) {
  return findProjects(project => (project('playerIds').contains(userId)))
}

export function findProjectsByIds(projectIds) {
  return table.getAll(...projectIds)
}

export function findProjects(filter) {
  if (!filter) {
    return table
  }
  if (Array.isArray(filter)) {
    return table
      .getAll(...filter)
      .union(
        table.getAll(...filter, {index: 'name'})
      )
      .distinct()
  }
  return table.filter(filter)
}

export function insertProjects(projects) {
  return insertAllIntoTable(projects, r.table('projects'))
}

export async function findProjectBySurveyId(surveyId) {
  const surveyIdFilter = project => {
    return r.or(
      project('projectReviewSurveyId').default('').eq(surveyId),
      project('retrospectiveSurveyId').default('').eq(surveyId)
    )
  }

  const projects = await findProjects(surveyIdFilter)
  if (projects.length !== 1) {
    throw new Error('Unable to find a project for survey')
  }

  return projects[0]
}

export function findProjectByPlayerIdAndCycleId(playerId, cycleId) {
  const projectFilter = project => r.and(
    project('cycleId').eq(cycleId),
    project('playerIds').contains(playerId)
  )

  const projectsQuery = findProjects(projectFilter)

  return r.branch(
   projectsQuery.count().eq(1),
   projectsQuery.nth(0),
   projectsQuery.count().gt(1),
   customQueryError('This player is in multiple projects this cycle'),
   customQueryError('This player is not in any projects this cycle'),
 )
}

export function findProjectByNameForPlayer(name, playerId) {
  const filter = project => r.and(
    project('name').eq(name),
    project('playerIds').contains(playerId)
  )
  return findProjects(filter)
    .nth(0)
    .default(customQueryError('No such project exist with that name for that player'))
}

export function update(project, options) {
  return updateInTable(project, table, options)
}
export const updateProject = update

export function findProjectsAndReviewResponsesForPlayer(chapterId, cycleId, playerId) {
  return findProjects({chapterId, cycleId})
    .hasFields('projectReviewSurveyId')
    .merge(project => ({
      projectReviewResponses: getSurveyById(project('projectReviewSurveyId'))
        .do(survey => survey('questionRefs')
          .map(questionRef => ({
            name: questionRef('name'),
            value: getSurveyResponsesForPlayer(playerId, survey('id'), questionRef('questionId'))
              .nth(0).default(r.object('value', null))('value'),
          }))
        )
    }))
    .orderBy('name')
}

export async function findActiveProjectsForChapter(chapterId, options = {}) {
  const latestCycle = await getLatestCycleForChapter(chapterId, {default: null})
  const activeProjects = latestCycle && (latestCycle.state === PRACTICE || latestCycle.state === REFLECTION) ?
    table.filter({chapterId, cycleId: latestCycle.id}) : null

  if (options.count) {
    return activeProjects ? activeProjects.count() : null
  }
  return activeProjects || []
}
