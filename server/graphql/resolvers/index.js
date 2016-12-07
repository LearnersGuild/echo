import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {getChapterById} from 'src/server/db/chapter'
import {getCycleById} from 'src/server/db/cycle'
import {getProjectById} from 'src/server/db/project'
import saveSurveyResponses from 'src/server/actions/saveSurveyResponses'
import assertPlayersCurrentCycleInState from 'src/server/actions/assertPlayersCurrentCycleInState'
import {handleError} from 'src/server/graphql/util'

export async function resolveCycleChapter(cycle) {
  if (cycle.chapter) {
    return cycle.chapter
  }
  if (cycle.chapterId) {
    return await getChapterById(cycle.chapterId)
  }
}

export async function resolveProjectChapter(project) {
  if (project.chapter) {
    return project.chapter
  }
  if (project.chapterId) {
    return await getChapterById(project.chapterId)
  }
}

export async function resolveProjectCycle(project) {
  if (project.cycle) {
    return project.cycle
  }
  if (project.cycleId) {
    return await getCycleById(project.cycleId)
  }
}

export async function resolveSurveyProject(parent) {
  if (parent.project) {
    return parent.project
  }
  if (parent.projectId) {
    return await getProjectById(parent.projectId)
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
