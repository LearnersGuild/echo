import {getChapterById} from 'src/server/db/chapter'
import {getCycleById} from 'src/server/db/cycle'
import {getProjectById} from 'src/server/db/project'

export {default as resolveSaveSurveyResponses} from './resolveSaveSurveyResponses'

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
