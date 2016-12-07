import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {getChapterById} from 'src/server/db/chapter'
import {getCycleById} from 'src/server/db/cycle'
import {getProjectById} from 'src/server/db/project'
import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertPlayersCurrentCycleInState from 'src/server/actions/assertPlayersCurrentCycleInState'
import {handleError} from 'src/server/graphql/util'

export async function resolveChapter(cycle) {
  if (cycle.chapter) {
    return cycle.chapter
  }
  if (cycle.chapterId) {
    return await getChapterById(cycle.chapterId)
  }
}

export async function resolveCycle(project) {
  if (project.cycle) {
    return project.cycle
  }
  if (project.cycleId) {
    return await getCycleById(project.cycleId)
  }
}

export async function resolveProject(parent) {
  if (parent.project) {
    return parent.project
  }
  if (parent.projectId) {
    return await getProjectById(parent.projectId)
  }
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

export async function resolveSaveSurveyResponses(source, {responses, projectName}, {rootValue: {currentUser}}) {
  if (!currentUser || !userCan(currentUser, 'saveResponse')) {
    throw new GraphQLError('You are not authorized to do that.')
  }

  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

  const createdIds = await saveSurveyResponses({respondentId: currentUser.id, responses, projectName})
    .catch(err => handleError(err, 'Failed to save responses'))

  return {createdIds}
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
