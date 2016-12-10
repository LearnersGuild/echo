import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {getLatestCycleForChapter} from 'src/server/db/cycle'
import {findActiveProjectsForChapter, findProjectsForUser} from 'src/server/db/project'
import findActivePlayersInChapter from 'src/server/actions/findActivePlayersInChapter'
import findProjectReviews from 'src/server/actions/findProjectReviews'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectReviews from 'src/server/actions/findUserProjectReviews'
import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertPlayersCurrentCycleInState from 'src/server/actions/assertPlayersCurrentCycleInState'
import {Chapter, Cycle, Project} from 'src/server/services/dataService'
import {handleError} from 'src/server/graphql/util'
import {mapById} from 'src/server/util'

export function resolveChapter(parent) {
  return parent.chapter || _safeResolveAsync(
    Chapter
      .get(parent.chapterId || null)
      .default(null)
      .run()
  )
}

export function resolveChapterLatestCycle(chapter) {
  return chapter.latestCycle || _safeResolveAsync(
    getLatestCycleForChapter(chapter.id, {default: null})
  )
}

export function resolveChapterActiveProjectCount(chapter) {
  return isNaN(chapter.activeProjectCount) ?
    _safeResolveAsync(
      findActiveProjectsForChapter(chapter.id, {count: true})
    ) : chapter.activeProjectCount
}

export function resolveChapterActivePlayerCount(chapter) {
  return isNaN(chapter.activePlayerCount) ?
    _safeResolveAsync(
      findActivePlayersInChapter(chapter.id, {count: true})
    ) : chapter.activePlayerCount
}

export function resolveCycle(parent) {
  return parent.cycle || _safeResolveAsync(
    Cycle.get(parent.cycleId || null).run()
  )
}

export function resolveProject(parent) {
  return parent.project || _safeResolveAsync(
    Project
      .get(parent.projectId || null)
      .default(null)
      .run()
  )
}

export function resolveProjectGoal(project) {
  if (!project.goal) {
    return null
  }
  const {githubIssue} = project.goal
  if (!githubIssue) {
    return project.goal
  }
  return {
    number: githubIssue.number,
    url: githubIssue.url,
    title: githubIssue.title,
  }
}

export function resolveProjectStats(project) {
  if (project.stats) {
    return project.stats
  }
  return {
    hours: null,
    completeness: null,
    quaity: null,
  }
}

export async function resolveProjectReviews(projectSummary) {
  const {project} = projectSummary
  if (!project) {
    throw new Error('Invalid project for user summaries')
  }
  if (projectSummary.projectReviews) {
    return projectSummary.projectReviews
  }

  return _mapUsers(
    await findProjectReviews(project),
    'submittedById',
    'submittedBy'
  )
}

export async function resolveProjectUserSummaries(projectSummary) {
  const {project} = projectSummary

  if (!project) {
    throw new Error('Invalid project for user summaries')
  }
  if (projectSummary.users) {
    return projectSummary.users
  }

  const users = await findUsers(project.playerIds)

  return users.map(async user => {
    const userSummary = await getUserProjectSummary(user, project)
    return userSummary
  })
}

export async function resolveUserProjectSummaries(userSummary) {
  const {user} = userSummary
  if (!user) {
    throw new Error('Invalid user for project summaries')
  }
  if (userSummary.projects) {
    return userSummary.projects
  }

  const projects = await findProjectsForUser(user.id)
  return projects.map(async project => {
    return await getUserProjectSummary(user, project)
  })
}

async function getUserProjectSummary(user, project) {
  return {
    user,
    project,
    userProjectStats: extractUserProjectStats(user, project),
    userProjectReviews: _mapUsers(
      await findUserProjectReviews(user, project),
      'submittedById',
      'submittedBy'
    ),
  }
}

export function extractUserProjectStats(user, project) {
  if (!user) {
    throw new Error(`Invalid user ${user}`)
  }
  if (!project) {
    throw new Error(`Invalid project ${project}`)
  }

  const stats = user.stats || {}
  const projects = stats.projects || {}
  const projectStats = projects[project.id] || {}
  const rating = (projectStats.elo || {}).rating
  const contribution = {
    self: projectStats.rcSelf,
    perHour: projectStats.rcPerHour,
    other: projectStats.rcOther,
    estimated: projectStats.rc,
    expected: projectStats.ec,
    delta: projectStats.ecd,
  }

  return {
    rating,
    contribution,
    userId: user.id,
    project: project.id,
    xp: projectStats.xp,
    hours: projectStats.hours,
    challenge: projectStats.challenge,
    culture: projectStats.cc,
    technical: projectStats.th,
    teamPlay: projectStats.teamPlay,
    receptiveness: projectStats.receptiveness,
    focus: projectStats.resultsFocus,
    leadership: projectStats.flexibleLeadership,
    friction: projectStats.frictionReduction,
  }
}

export function resolveUserStats(user, args, {rootValue: {currentUser}}) {
  if (user.id !== currentUser.id && !userCan(currentUser, 'viewUserStats')) {
    return null
  }
  if (user.stats && 'rating' in user.stats) {
    return user.stats
  }

  const userStats = user.stats || {}
  return {
    rating: (userStats.elo || {}).rating,
    xp: userStats.xp,
  }
}

export async function resolveSaveSurveyResponses(source, {responses, projectName}, {rootValue: {currentUser}}) {
  if (!currentUser || !userCan(currentUser, 'saveResponse')) {
    throw new GraphQLError('You are not authorized to do that.')
  }

  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

  const createdIds = await saveSurveyResponses({respondentId: currentUser.id, responses, projectName})
    .catch(err => handleError(err, 'Failed to save responses'))

  return {createdIds}
}

async function _mapUsers(collection, userIdKey = 'userId', userKey = 'user') {
  if (!collection || collection.length === 0) {
    return []
  }

  const userIds = collection.map(item => item[userIdKey])
  const usersById = mapById(await findUsers(userIds))
  collection.forEach(item => {
    item[userKey] = usersById.get(item[userIdKey])
  })

  return collection
}

async function _safeResolveAsync(query) {
  try {
    return await query
  } catch (err) {
    return null
  }
}
