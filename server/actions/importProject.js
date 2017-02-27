import logger from 'src/server/util/logger'
import findUsers from 'src/server/actions/findUsers'
import {getGoalInfo} from 'src/server/services/gitHub'
import generateProjectName from 'src/server/actions/generateProjectName'
import initializeProject from 'src/server/actions/initializeProject'
import {Project} from 'src/server/services/dataService'
import {getChapter} from 'src/server/db/chapter'
import {getProject} from 'src/server/db/project'
import {getCycleForChapter} from 'src/server/db/cycle'

export default async function importProject(data = {}, options = {}) {
  const {chapter, cycle, project, goal, users} = await _parseProjectInput(data)

  const projectValues = {
    chapterId: chapter.id,
    cycleId: cycle.id,
  }
  if (goal) {
    projectValues.goal = goal
  }
  if (users) {
    projectValues.playerIds = users.map(p => p.id)
  }

  let savedProject
  if (project) {
    projectValues.id = project.id
    savedProject = await Project.get(project.id).update(projectValues)
  } else {
    projectValues.name = data.projectIdentifier || await generateProjectName()
    savedProject = await new Project(projectValues).save()
  }

  if (options.initializeChannel) {
    await initializeProject(savedProject, users)
  }

  logger.debug(`Project imported: #${savedProject.name} (${savedProject.id})`)

  return savedProject
}

async function _parseProjectInput(data) {
  const {
    projectIdentifier,
    chapterIdentifier,
    cycleIdentifier,
    goalIdentifier,
    userIdentifiers,
  } = data || {}

  const [chapter, users] = await Promise.all([
    getChapter(chapterIdentifier),
    userIdentifiers ? findUsers(userIdentifiers, {idmFields: ['id', 'handle']}) : null,
  ])

  if (!chapter) {
    throw new Error(`Chapter not found for identifier ${chapterIdentifier}`)
  }

  if (userIdentifiers && users.length !== userIdentifiers.length) {
    const notFoundIds = userIdentifiers.filter(id => !users.find(u => (u.handle === id || u.id === id)))
    throw new Error(`Users not found for identifiers: ${notFoundIds.join(', ')}`)
  }

  const cycle = await getCycleForChapter(chapter.id, cycleIdentifier)
  if (!cycle) {
    throw new Error(`Cycle not found for identifier ${cycleIdentifier} in chapter ${chapterIdentifier}`)
  }
  if (cycle.chapterId !== chapter.id) {
    throw new Error(`Cycle ${cycleIdentifier} chapter ID ${cycle.chapterId} does not match chapter ${chapterIdentifier} ID ${chapter.id}`)
  }

  let project
  if (projectIdentifier) {
    project = await getProject(projectIdentifier)
    if (project) {
      if (project.chapterId !== chapter.id) {
        throw new Error(`Project ${projectIdentifier} chapter ID ${project.chapterId} does not match chapter ${chapterIdentifier} ID ${chapter.id}`)
      }
      if (project.cycleId !== cycle.id) {
        throw new Error(`Project ${projectIdentifier} cycle ID ${project.cycleId} does not match cycle ${cycleIdentifier} ID ${cycle.id}`)
      }
    }
  }

  let goal
  if (goalIdentifier && !goal) {
    const goalNumber = parseInt(goalIdentifier, 10)
    goal = await getGoalInfo(chapter.goalRepositoryURL, goalNumber)
    if (!goal) {
      throw new Error(`Goal not found with identifier: ${goalIdentifier}`)
    }
  }

  if (!project) {
    if (!goal) {
      throw new Error('New project imports must specify a goal')
    }
    if (!Array.isArray(userIdentifiers) || userIdentifiers.length === 0) {
      throw new Error('New project imports must specify at least one user')
    }
  }

  return {chapter, cycle, project, goal, users}
}
