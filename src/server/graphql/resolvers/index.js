import Promise from 'bluebird'
import moment from 'moment'

import {surveyCompletedBy, surveyLockedFor} from 'src/common/models/survey'
import findActiveMembersInChapter from 'src/server/actions/findActiveMembersInChapter'
import findActiveProjectsForChapter from 'src/server/actions/findActiveProjectsForChapter'
import findActiveMembersForPhase from 'src/server/actions/findActiveMembersForPhase'
import getUser from 'src/server/actions/getUser'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectEvaluations from 'src/server/actions/findUserProjectEvaluations'
import handleSubmitSurvey from 'src/server/actions/handleSubmitSurvey'
import handleSubmitSurveyResponses from 'src/server/actions/handleSubmitSurveyResponses'
import {
  Chapter, Cycle, Member, Project, Survey, Phase,
  findProjectsForUser,
  getLatestCycleForChapter,
} from 'src/server/services/dataService'
import {LGBadRequestError, LGNotAuthorizedError, LGInternalServerError} from 'src/server/util/error'
import {mapById, userCan} from 'src/common/util'

export function resolveChapter(parent) {
  return parent.chapter ||
    (parent.chapterId ? _safeResolveAsync(Chapter.get(parent.chapterId)) : null)
}

export function resolvePhase(parent) {
  return parent.phase ||
    (parent.phaseId ? _safeResolveAsync(Phase.get(parent.phaseId)) : null)
}

export async function resolvePhaseCurrentProjects(phaseSummary, args, {currentUser}) {
  if (phaseSummary.currentProjects) {
    return phaseSummary.currentProjects
  }
  if (!phaseSummary.phase) {
    throw new LGInternalServerError('Cannot resolve current members without phase')
  }
  const currentMember = await Member.get(currentUser.id)
  if (!currentMember || !currentMember.chapterId) {
    throw new LGNotAuthorizedError('Must be a member of a chapter to view current phase projects')
  }
  return _safeResolveAsync(
    findActiveProjectsForChapter(currentMember.chapterId, {filter: {phaseId: phaseSummary.phase.id}})
  ) || []
}

export async function resolvePhaseCurrentMembers(phaseSummary) {
  if (phaseSummary.currentMembers) {
    return phaseSummary.currentMembers
  }
  if (!phaseSummary.phase) {
    throw new LGInternalServerError('Cannot resolve current members without phase')
  }
  return findActiveMembersForPhase(phaseSummary.phase.id)
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

export async function resolveChapterActiveMemberCount(chapter) {
  return isNaN(chapter.activeMemberCount) ?
    (await _safeResolveAsync(
      findActiveMembersInChapter(chapter.id)
    ) || []).length : chapter.activeMemberCount
}

export function resolveCycle(parent) {
  return parent.cycle || _safeResolveAsync(
    Cycle.get(parent.cycleId || '')
  )
}

export async function resolveFindProjectsForCycle(source, args = {}, {currentUser}) {
  if (!userCan(currentUser, 'findProjects')) {
    throw new LGNotAuthorizedError()
  }

  const {cycleNumber} = args
  const member = await Member.get(currentUser.id)
  const currentChapter = await Chapter.get(member.chapterId)
  const chapterId = currentChapter.id

  const cycle = cycleNumber ?
    (await Cycle.filter({chapterId, cycleNumber}))[0] :
    (await getLatestCycleForChapter(currentChapter.id))

  if (!cycle) {
    console.warn(`Cycle not found for chapter ${currentChapter.name}`)
    return []
  }

  let projects = await Project.filter({cycleId: cycle.id})
  if (projects.length === 0 && !cycleNumber) {
    // user did not specify a cycle and current cycle has no projects;
    // automatically return projects for the previous cycle
    const previousCycleNumber = cycle.cycleNumber - 1
    if (previousCycleNumber > 0) {
      const previousCycle = (await Cycle.filter({chapterId, cycleNumber: previousCycleNumber}))[0]
      if (!previousCycle) {
        throw new LGBadRequestError(`Cycle ${previousCycleNumber} not found for chapter ${currentChapter.name}`)
      }
      projects = await Project.filter({cycleId: previousCycle.id})
    }
  }

  return projects
}

export function resolveWeekStartedAt(parent) {
  if (parent.weekStartedAt) {
    return parent.weekStartedAt
  }

  const parentStartedAt = moment(parent.startTimestamp || parent.createdAt || new Date())
  const thursdayOfStartWeek = parentStartedAt.clone().isoWeekday('Thursday')

  return parentStartedAt.isAfter(thursdayOfStartWeek) ?
    parentStartedAt.startOf('isoweek').add(7, 'days').toDate() :
    parentStartedAt.startOf('isoweek').toDate()
}

export async function resolveUser(source, {identifier}, {currentUser}) {
  if (!userCan(currentUser, 'viewUser')) {
    throw new LGNotAuthorizedError()
  }
  const user = await getUser(identifier)
  if (!user) {
    throw new LGBadRequestError(`User not found for identifier ${identifier}`)
  }
  return user
}

export async function resolveUserProjectSummaries(userSummary, args, {currentUser}) {
  const {user} = userSummary
  if (!user) {
    throw new Error('Invalid user for project summaries')
  }
  if (userSummary.userProjectSummaries) {
    return userSummary.userProjectSummaries
  }

  const projects = await findProjectsForUser(user.id)
  const projectUserIds = projects.reduce((result, project) => {
    if (project.memberIds && project.memberIds.length > 0) {
      result.push(...project.memberIds)
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
  if (user.id !== currentUser.id && !userCan(currentUser, 'viewUserFeedback')) {
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
    userProjectEvaluations,
    userRetrospectiveComplete,
    userRetrospectiveUnlocked,
  }
}

export async function resolveSubmitSurvey(source, {surveyId}, {currentUser}) {
  await handleSubmitSurvey(surveyId, currentUser.id)
  return {success: true}
}

export async function resolveSaveRetrospectiveSurveyResponses(source, {responses}, {currentUser}) {
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
      throw new LGBadRequestError('You cannot submit responses for other members.')
    }
  })
}

async function _safeResolveAsync(query) {
  try {
    return await query
  } catch (err) {
    console.warn(err.message)
    return null
  }
}
