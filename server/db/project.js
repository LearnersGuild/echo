import r from '../../db/connect'
import {customQueryError} from './errors'
import {insertAllIntoTable} from './util'

const table = r.table('projects')

export function getProjectById(id) {
  return table.get(id)
}

export function getProjectsForChapter(chapterId) {
  return table.getAll(chapterId, {index: 'chapterId'})
}

export function findProjects(options) {
  const projects = table
  return options && options.filter ?
    projects.filter(options.filter) :
    projects
}

export function insertProjects(projects) {
  return insertAllIntoTable(projects, r.table('projects'))
}

export function findProjectByPlayerIdAndCycleId(playerId, cycleId) {
  return findProjects(
    project => project('cycleTeams')(cycleId)('playerIds').contains(playerId)
  ).nth(0)
  .default(
    customQueryError('This player is not in any projects this cycle')
  )
}
