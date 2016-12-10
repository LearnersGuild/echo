import Promise from 'bluebird'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {getProjectByName, findActiveProjectsForChapter, findProjectsForUser} from 'src/server/db/project'
import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertPlayersCurrentCycleInState from 'src/server/actions/assertPlayersCurrentCycleInState'
import {getLatestCycleForChapter} from 'src/server/db/cycle'
import findActivePlayersInChapter from 'src/server/actions/findActivePlayersInChapter'
import findProjectReviews from 'src/server/actions/findProjectReviews'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectReviews from 'src/server/actions/findUserProjectReviews'
import getUser from 'src/server/actions/getUser'
import {Chapter, Cycle, Project, Survey} from 'src/server/services/dataService'
import {handleError} from 'src/server/graphql/util'
import {BadInputError} from 'src/server/errors'
import {mapById, roundDecimal} from 'src/server/util'

export async function resolveGetUser(source, {identifier}, {rootValue: {currentUser}}) {
  if (!userCan(currentUser, 'viewUser')) {
    throw new GraphQLError('You are not authorized to do that.')
  }
  const user = await getUser(identifier)
  if (!user) {
    throw new GraphQLError(`User not found for identifier ${identifier}`)
  }
  return user
}

export function resolveChapter(parent) {
  return parent.chapter || _safeResolveAsync(
    Chapter
      .get(parent.chapterId || null)
      .default(null)
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
    Cycle.get(parent.cycleId || null)
  )
}

export function resolveProject(parent) {
  return parent.project || _safeResolveAsync(
    Project
      .get(parent.projectId || null)
      .default(null)
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
    quality: null,
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
  if (projectSummary.projectUserSummaries) {
    return projectSummary.projectUserSummaries
  }

  const users = await findUsers(project.playerIds)
  return Promise.map(users, async user => {
    const summary = await getUserProjectSummary(user, project)
    return {user, ...summary}
  })
}

export async function resolveUserProjectSummaries(userSummary) {
  const {user} = userSummary
  if (!user) {
    throw new Error('Invalid user for project summaries')
  }
  if (userSummary.userProjectSummaries) {
    return userSummary.userProjectSummaries
  }

  const projects = await findProjectsForUser(user.id)
  return Promise.map(projects, async project => {
    const summary = await getUserProjectSummary(user, project)
    return {project, ...summary}
  })
}

async function getUserProjectSummary(user, project) {
  return {
    userProjectStats: extractUserProjectStats(user, project),
    userProjectReviews: await _mapUsers(
      await findUserProjectReviews(user, project),
      'submittedById',
      'submittedBy',
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

export async function resolveSaveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  _assertUserAuthorized(currentUser, 'saveResponse')
  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)
  return await _validateAndSaveResponses(responses, currentUser)
}

export async function resolveSaveProjectReviewCLISurveyResponses(source, {responses: namedResponses, projectName}, {rootValue: {currentUser}}) {
  _assertUserAuthorized(currentUser, 'saveResponse')
  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)
  const responses = await _buildResponsesFromNamedResponses(namedResponses, projectName, currentUser.id)
  return await _validateAndSaveResponses(responses, currentUser)
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
    xp: roundDecimal(userStats.xp) || 0,
  }
}

async function _validateAndSaveResponses(responses, currentUser) {
  await _assertCurrentUserCanSubmitResponsesForRespodent(currentUser, responses)

  return await saveSurveyResponses({responses})
    .then(createdIds => ({createdIds}))
    .catch(err => handleError(err, 'Failed to save responses'))
}

function _assertCurrentUserCanSubmitResponsesForRespodent(currentUser, responses) {
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

function _assertUserAuthorized(user, action) {
  if (!user || !userCan(user, action)) {
    throw new GraphQLError('You are not authorized to do that.')
  }
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
    console.error(err)
    return null
  }
}
