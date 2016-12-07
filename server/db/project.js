import {connect} from 'src/db'
import {REFLECTION} from 'src/common/models/cycle'

import {customQueryError} from './errors'
import {insertAllIntoTable, updateInTable} from './util'
import {cyclesTable} from './cycle'
import {getSurveyById} from './survey'
import {getSurveyResponsesForPlayer} from './response'

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

export function getProjectsForPlayer(playerId) {
  return findProjects(project => (project('playerIds').contains(playerId)))
}

export function findProjects(filter) {
  return filter ? table.filter(filter) : table
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

export async function findActiveProjectReviewSurvey(project) {
  const projectCycle = await cyclesTable.get(project.cycleId)
  if (!projectCycle) {
    throw new Error(`Project ${project.id} has an invalid cycle ID ${project.cycleId}`)
  }
  if (projectCycle.state !== REFLECTION) {
    return
  }
  if (!project.projectReviewSurveyId) {
    return
  }
  return getSurveyById(project.projectReviewSurveyId)
}

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
