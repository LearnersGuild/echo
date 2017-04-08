import Promise from 'bluebird'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'
import {surveyCompletedBy, surveyLockedFor} from 'src/common/models/survey'
import {findActiveProjectsForChapter, findProjectsForUser} from 'src/server/db/project'
import {getLatestCycleForChapter} from 'src/server/db/cycle'
import findActivePlayersInChapter from 'src/server/actions/findActivePlayersInChapter'
import findProjectEvaluations from 'src/server/actions/findProjectEvaluations'
import getUser from 'src/server/actions/getUser'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectEvaluations from 'src/server/actions/findUserProjectEvaluations'
import handleSubmitSurvey from 'src/server/actions/handleSubmitSurvey'
import handleSubmitSurveyResponses from 'src/server/actions/handleSubmitSurveyResponses'
import {Chapter, Cycle, Project, Survey} from 'src/server/services/dataService'
import {LGBadRequestError, LGNotAuthorizedError} from 'src/server/util/error'
import {mapById, roundDecimal, userCan} from 'src/common/util'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  INTERNAL_PROJECT_REVIEW_COUNT,
  LEVEL,
  PROJECT_COMPLETENESS,
  PROJECT_HOURS,
  PROJECT_REVIEW_ACCURACY,
  RELATIVE_CONTRIBUTION,
  RELATIVE_CONTRIBUTION_DELTA,
  RELATIVE_CONTRIBUTION_EXPECTED,
  RELATIVE_CONTRIBUTION_HOURLY,
  RELATIVE_CONTRIBUTION_OTHER,
  RELATIVE_CONTRIBUTION_SELF,
  TEAM_PLAY,
  TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  TEAM_PLAY_FRICTION_REDUCTION,
  TEAM_PLAY_RECEPTIVENESS,
  TEAM_PLAY_RESULTS_FOCUS,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

export function resolveChapter(parent) {
  return parent.chapter || _safeResolveAsync(
    Chapter.get(parent.chapterId || null)
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

export async function resolveChapterActivePlayerCount(chapter) {
  return isNaN(chapter.activePlayerCount) ?
    (await _safeResolveAsync(
      findActivePlayersInChapter(chapter.id)
    ) || []).length : chapter.activePlayerCount
}

export function resolveCycle(parent) {
  return parent.cycle || _safeResolveAsync(
    Cycle.get(parent.cycleId || '')
  )
}

export function resolveProject(parent) {
  return parent.project || _safeResolveAsync(
    Project.get(parent.projectId || '')
  )
}

export function resolveProjectGoal(project) {
  if (!project.goal) {
    return null
  }
  return project.goal
}

export function resolveProjectPlayers(project) {
  if (project.players) {
    return project.players
  }
  return findUsers(project.playerIds)
}

export async function resolveProjectCoach(project) {
  if (project.coach) {
    return project.coach
  }
  if (project.coachId) {
    return getUser(project.coachId)
  }
}

export function resolveProjectStats(project) {
  if (project.state !== PROJECT_STATES.CLOSED) {
    return {}
  }
  if (project.stats && PROJECT_COMPLETENESS in project.stats) {
    return project.stats
  }
  const projectStats = project.stats || {}
  return {
    [PROJECT_COMPLETENESS]: projectStats[PROJECT_COMPLETENESS] || null,
    [PROJECT_HOURS]: projectStats[PROJECT_HOURS] || null,
  }
}

export async function resolveProjectEvaluations(projectSummary, args, {rootValue: {currentUser}}) {
  const {project} = projectSummary
  if (!project) {
    throw new Error('Invalid project for user summaries')
  }

  if (projectSummary.projectEvaluations) {
    return projectSummary.projectEvaluations
  }

  return _mapUsers(
    await findProjectEvaluations(project),
    'submittedById',
    'submittedBy'
  ).filter(({submittedById}) => (
    project.state === PROJECT_STATES.CLOSED ||
    submittedById === currentUser.id ||
    userCan(currentUser, 'viewProjectEvaluation')
  ))
}

export async function resolveProjectUserSummaries(projectSummary, args, {rootValue: {currentUser}}) {
  const {project} = projectSummary
  if (!project) {
    throw new Error('Invalid project for user summaries')
  }

  if (projectSummary.projectUserSummaries) {
    return projectSummary.projectUserSummaries
  }

  const projectUsers = await findUsers(project.playerIds)

  const projectUserMap = mapById(projectUsers)

  return Promise.map(projectUsers, async user => {
    const canViewSummary = user.id === currentUser.id || userCan(currentUser, 'viewProjectUserSummary')
    const summary = canViewSummary ? await getUserProjectSummary(user, project, projectUserMap, currentUser) : {}
    return {user, ...summary}
  })
}

export async function resolveUser(source, {identifier}, {rootValue: {currentUser}}) {
  if (!userCan(currentUser, 'viewUser')) {
    throw new LGNotAuthorizedError()
  }
  const user = await getUser(identifier)
  if (!user) {
    throw new LGBadRequestError(`User not found for identifier ${identifier}`)
  }
  return user
}

export function resolveUserStats(user, args, {rootValue: {currentUser}}) {
  if (user.id !== currentUser.id && !userCan(currentUser, 'viewUserStats')) {
    return null
  }
  if (user.stats && CHALLENGE in user.stats) {
    // we know that stats were already resolved properly, because CHALLENGE
    // would ordinarily be a part of weightedAverages
    return user.stats
  }

  const userStats = user.stats || {}
  const userAverageStats = userStats.weightedAverages || {}
  return {
    [LEVEL]: userStats[LEVEL] || 0,
    [ELO]: (userStats[ELO] || {}).rating,
    [EXPERIENCE_POINTS]: roundDecimal(userStats[EXPERIENCE_POINTS]) || 0,
    [CULTURE_CONTRIBUTION]: roundDecimal(userAverageStats[CULTURE_CONTRIBUTION]),
    [TEAM_PLAY]: roundDecimal(userAverageStats[TEAM_PLAY]),
    [TECHNICAL_HEALTH]: roundDecimal(userAverageStats[TECHNICAL_HEALTH]),
    [ESTIMATION_ACCURACY]: roundDecimal(userAverageStats[ESTIMATION_ACCURACY]),
    [ESTIMATION_BIAS]: roundDecimal(userAverageStats[ESTIMATION_BIAS]),
    [CHALLENGE]: roundDecimal(userAverageStats[CHALLENGE]),
    [EXTERNAL_PROJECT_REVIEW_COUNT]: userStats[EXTERNAL_PROJECT_REVIEW_COUNT],
    [INTERNAL_PROJECT_REVIEW_COUNT]: userStats[INTERNAL_PROJECT_REVIEW_COUNT],
    [PROJECT_REVIEW_ACCURACY]: userStats[PROJECT_REVIEW_ACCURACY],
  }
}

export async function resolveUserProjectSummaries(userSummary, args, {rootValue: {currentUser}}) {
  const {user} = userSummary
  if (!user) {
    throw new Error('Invalid user for project summaries')
  }
  if (userSummary.userProjectSummaries) {
    return userSummary.userProjectSummaries
  }

  const projects = await findProjectsForUser(user.id)
  const projectUserIds = projects.reduce((result, project) => {
    if (project.playerIds && project.playerIds.length > 0) {
      result.push(...project.playerIds)
    }
    return result
  }, [])

  const projectUserMap = mapById(await findUsers(projectUserIds))

  const sortedProjects = projects.sort((a, b) => a.createdAt - b.createdAt).reverse()
  return Promise.map(sortedProjects, async project => {
    const summary = await getUserProjectSummary(user, project, projectUserMap, currentUser)
    return {project, ...summary}
  })
}

async function getUserProjectSummary(user, project, projectUserMap, currentUser) {
  if (user.id !== currentUser.id && !userCan(currentUser, 'viewUserStats')) {
    return null
  }
  const userProjectEvaluations = await findUserProjectEvaluations(user, project)
  userProjectEvaluations.forEach(evaluation => {
    evaluation.submittedBy = projectUserMap.get(evaluation.submittedById)
  })

  let userRetrospectiveComplete
  let userRetrospectiveUnlocked

  if (project.retrospectiveSurveyId) {
    const survey = await Survey.get(project.retrospectiveSurveyId)
    userRetrospectiveComplete = surveyCompletedBy(survey, user.id)
    userRetrospectiveUnlocked = !surveyLockedFor(survey, user.id)
  }

  return {
    userProjectStats: extractUserProjectStats(user, project),
    userProjectEvaluations,
    userRetrospectiveComplete,
    userRetrospectiveUnlocked,
  }
}

export function extractUserProjectStats(user, project) {
  if (!user) {
    throw new Error(`Invalid user ${user}`)
  }
  if (!project) {
    throw new Error(`Invalid project ${project}`)
  }

  const userStats = user.stats || {}
  const userProjects = userStats.projects || {}
  const userProjectStats = userProjects[project.id] || {}

  return {
    userId: user.id,
    project: project.id,
    [LEVEL]: userProjectStats[LEVEL],
    [CHALLENGE]: userProjectStats[CHALLENGE],
    [CULTURE_CONTRIBUTION]: userProjectStats[CULTURE_CONTRIBUTION],
    [ESTIMATION_ACCURACY]: userProjectStats[ESTIMATION_ACCURACY],
    [ESTIMATION_BIAS]: userProjectStats[ESTIMATION_BIAS],
    [EXPERIENCE_POINTS]: userProjectStats[EXPERIENCE_POINTS],
    [TEAM_PLAY_FLEXIBLE_LEADERSHIP]: userProjectStats[TEAM_PLAY_FLEXIBLE_LEADERSHIP],
    [TEAM_PLAY_FRICTION_REDUCTION]: userProjectStats[TEAM_PLAY_FRICTION_REDUCTION],
    [PROJECT_HOURS]: userProjectStats[PROJECT_HOURS],
    [ELO]: (userProjectStats[ELO] || {}).rating,
    [TEAM_PLAY_RECEPTIVENESS]: userProjectStats[TEAM_PLAY_RECEPTIVENESS],
    [RELATIVE_CONTRIBUTION]: userProjectStats[RELATIVE_CONTRIBUTION],
    [RELATIVE_CONTRIBUTION_DELTA]: userProjectStats[RELATIVE_CONTRIBUTION_DELTA],
    [RELATIVE_CONTRIBUTION_EXPECTED]: userProjectStats[RELATIVE_CONTRIBUTION_EXPECTED],
    [RELATIVE_CONTRIBUTION_HOURLY]: userProjectStats[RELATIVE_CONTRIBUTION_HOURLY],
    [RELATIVE_CONTRIBUTION_OTHER]: userProjectStats[RELATIVE_CONTRIBUTION_OTHER],
    [RELATIVE_CONTRIBUTION_SELF]: userProjectStats[RELATIVE_CONTRIBUTION_SELF],
    [TEAM_PLAY_RESULTS_FOCUS]: userProjectStats[TEAM_PLAY_RESULTS_FOCUS],
    [TEAM_PLAY]: userProjectStats[TEAM_PLAY],
    [TECHNICAL_HEALTH]: userProjectStats[TECHNICAL_HEALTH],
  }
}

export async function resolveSubmitSurvey(source, {surveyId}, {rootValue: {currentUser}}) {
  await handleSubmitSurvey(surveyId, currentUser.id)
  return {success: true}
}

export async function resolveSaveRetrospectiveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  _assertUserAuthorized(currentUser, 'saveResponse')
  await _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses)
  return handleSubmitSurveyResponses(responses)
}

function _assertUserAuthorized(user, action) {
  if (!user || !userCan(user, action)) {
    throw new LGNotAuthorizedError()
  }
}

function _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses) {
  responses.forEach(response => {
    if (currentUser.id !== response.respondentId) {
      throw new LGBadRequestError('You cannot submit responses for other players.')
    }
  })
}

async function _mapUsers(collection, userIdKey = 'userId', userKey = 'user') {
  if (!Array.isArray(collection) || collection.length === 0) {
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
    console.error(err)
    return null
  }
}
