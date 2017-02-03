import Promise from 'bluebird'
import {GraphQLError} from 'graphql/error'

import {connect} from 'src/db'
import {userCan, roundDecimal} from 'src/common/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {CYCLE_REFLECTION_STATES} from 'src/common/models/cycle'
import {getProjectByName, findActiveProjectsForChapter, findProjectsForUser} from 'src/server/db/project'
import {getLatestCycleForChapter} from 'src/server/db/cycle'
import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertCycleInState from 'src/server/actions/assertCycleInState'
import findActivePlayersInChapter from 'src/server/actions/findActivePlayersInChapter'
import findProjectEvaluations from 'src/server/actions/findProjectEvaluations'
import getUser from 'src/server/actions/getUser'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectEvaluations from 'src/server/actions/findUserProjectEvaluations'
import {Chapter, Cycle, Project, Survey} from 'src/server/services/dataService'
import {handleError} from 'src/server/graphql/util'
import {BadInputError} from 'src/server/errors'
import {mapById} from 'src/server/util'
import {computePlayerLevel} from 'src/server/util/stats'

const r = connect()

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
  const {githubIssue} = project.goal
  if (!githubIssue) {
    return project.goal
  }
  const level = (githubIssue.milestone || {}).title || 'Level ?'
  return {
    number: githubIssue.number,
    url: githubIssue.url,
    title: githubIssue.title,
    level: level.replace('Level ', ''),
  }
}

export function resolveProjectPlayers(project) {
  if (project.players) {
    return project.players
  }
  return findUsers(project.playerIds)
}

export function resolveProjectStats(project) {
  if (project.stats && STAT_DESCRIPTORS.PROJECT_COMPLETENESS in project.stats) {
    return project.stats
  }
  const projectStats = project.stats || {}
  return {
    [STAT_DESCRIPTORS.PROJECT_COMPLETENESS]: projectStats.completeness || null,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: projectStats.hours || null,
    [STAT_DESCRIPTORS.PROJECT_QUALITY]: projectStats.quality || null,
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
  ).filter(({submittedById}) => submittedById === currentUser.id || userCan(currentUser, 'viewProjectEvaluation'))
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
    throw new GraphQLError('You are not authorized to do that.')
  }
  const user = await getUser(identifier)
  if (!user) {
    throw new GraphQLError(`User not found for identifier ${identifier}`)
  }
  return user
}

export async function resolveUserStats(user, args, {rootValue: {currentUser}}) {
  if (user.id !== currentUser.id && !userCan(currentUser, 'viewUserStats')) {
    return null
  }
  if (user.stats && STAT_DESCRIPTORS.RATING_ELO in user.stats) {
    return user.stats
  }

  const userStats = user.stats || {}
  const userAverageStats = userStats.weightedAverages || {}
  const levelDetails = await computePlayerLevelDetails(user)
  return {
    [STAT_DESCRIPTORS.LEVEL]: levelDetails.level,
    inTheRedStats: levelDetails.inTheRedStats,
    [STAT_DESCRIPTORS.RATING_ELO]: (userStats.elo || {}).rating,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: roundDecimal(userStats.xp) || 0,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: roundDecimal(userAverageStats.cc),
    [STAT_DESCRIPTORS.TEAM_PLAY]: roundDecimal(userAverageStats.tp),
    [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: roundDecimal(userAverageStats.th),
    [STAT_DESCRIPTORS.TIME_ON_TASK]: roundDecimal(userAverageStats[STAT_DESCRIPTORS.TIME_ON_TASK]),
    [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: roundDecimal(userAverageStats[STAT_DESCRIPTORS.ESTIMATION_ACCURACY]),
    [STAT_DESCRIPTORS.ESTIMATION_BIAS]: roundDecimal(userAverageStats[STAT_DESCRIPTORS.ESTIMATION_BIAS]),
    [STAT_DESCRIPTORS.CHALLENGE]: roundDecimal(userAverageStats[STAT_DESCRIPTORS.CHALLENGE]),
    [STAT_DESCRIPTORS.NUM_PROJECTS_REVIEWED]: userStats[STAT_DESCRIPTORS.NUM_PROJECTS_REVIEWED],
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
  return {
    userProjectStats: extractUserProjectStats(user, project),
    userProjectEvaluations,
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
    [STAT_DESCRIPTORS.LEVEL]: computePlayerLevel(user),
    [STAT_DESCRIPTORS.CHALLENGE]: userProjectStats.challenge,
    [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: userProjectStats.cc,
    [STAT_DESCRIPTORS.ESTIMATION_ACCURACY]: userProjectStats.estimationAccuracy,
    [STAT_DESCRIPTORS.ESTIMATION_BIAS]: userProjectStats.estimationBias,
    [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: userProjectStats.xp,
    [STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP]: userProjectStats.flexibleLeadership,
    [STAT_DESCRIPTORS.FRICTION_REDUCTION]: userProjectStats.frictionReduction,
    [STAT_DESCRIPTORS.PROJECT_HOURS]: userProjectStats.hours,
    [STAT_DESCRIPTORS.RATING_ELO]: (userProjectStats.elo || {}).rating,
    [STAT_DESCRIPTORS.RECEPTIVENESS]: userProjectStats.receptiveness,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: userProjectStats.rc,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_DELTA]: userProjectStats.ecd,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_EXPECTED]: userProjectStats.ec,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_HOURLY]: userProjectStats.rcPerHour,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_OTHER]: userProjectStats.rcOther,
    [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION_SELF]: userProjectStats.rcSelf,
    [STAT_DESCRIPTORS.RESULTS_FOCUS]: userProjectStats.resultsFocus,
    [STAT_DESCRIPTORS.TEAM_PLAY]: userProjectStats.tp,
    [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: userProjectStats.th,
    [STAT_DESCRIPTORS.TIME_ON_TASK]: userProjectStats.timeOnTask,
  }
}

export async function resolveSaveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  _assertUserAuthorized(currentUser, 'saveResponse')
  return await _validateAndSaveResponses(responses, currentUser)
}

export async function resolveSaveProjectReviewCLISurveyResponses(source, {responses: namedResponses, projectName}, {rootValue: {currentUser}}) {
  _assertUserAuthorized(currentUser, 'saveResponse')
  const responses = await _buildResponsesFromNamedResponses(namedResponses, projectName, currentUser.id)
  return await _validateAndSaveResponses(responses, currentUser)
}

function _assertUserAuthorized(user, action) {
  if (!user || !userCan(user, action)) {
    throw new GraphQLError('You are not authorized to do that.')
  }
}

async function _validateAndSaveResponses(responses, currentUser) {
  await _assertResponsesAreAllowedForCycle(responses)
  await _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses)
  return await saveSurveyResponses({responses})
    .then(createdIds => ({createdIds}))
    .catch(err => handleError(err, 'Failed to save responses'))
}

function _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses) {
  responses.forEach(response => {
    if (currentUser.id !== response.respondentId) {
      throw new BadInputError('You cannot submit responses for other players.')
    }
  })
}

async function _buildResponsesFromNamedResponses(namedResponses, projectName, respondentId) {
  const project = await getProjectByName(projectName)
  const survey = await Survey.get(project.projectReviewSurveyId)

  return namedResponses.map(namedResponse => {
    const {questionName, responseParams} = namedResponse
    const {questionId, subjectIds} = survey.questionRefs.find(ref => ref.name === questionName) || {}
    return {
      respondentId,
      questionId,
      surveyId: survey.id,
      values: [{subjectId: subjectIds[0], value: responseParams[0]}]
    }
  })
}

async function _assertResponsesAreAllowedForCycle(responses) {
  const responsesBySurveyId = mapById(responses, 'surveyId')
  const surveyIds = Array.from(responsesBySurveyId.keys())
  const projects = await Project.filter(project => r.or(
    r.expr(surveyIds).contains(project('retrospectiveSurveyId').default('')),
    r.expr(surveyIds).contains(project('projectReviewSurveyId').default('')),
  ))
  .pluck('cycleId')
  .distinct()
  const responseCycles = await Cycle.getAll(...projects.map(p => p.cycleId))
  await Promise.each(responseCycles, cycle => assertCycleInState(cycle, CYCLE_REFLECTION_STATES))
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
