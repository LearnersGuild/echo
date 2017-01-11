/* eslint-disable prefer-arrow-callback */
import Promise from 'bluebird'
import {formProjectsIfNoneExist} from 'src/server/actions/formProjects'
import initializeProject from 'src/server/actions/initializeProject'
import sendCycleLaunchAnnouncement from 'src/server/actions/sendCycleLaunchAnnouncement'
import {findModeratorsForChapter} from 'src/server/db/moderator'
import {findProjects} from 'src/server/db/project'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleLaunched', processCycleLaunched, _handleCycleLaunchError)
}

export async function processCycleLaunched(cycle, options) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  await formProjectsIfNoneExist(cycle.id, err => _notifyModerators(cycle, `⚠️ ${err.message}`))
  const projects = await findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})

  await Promise.each(projects, project => initializeProject(project, options))

  return sendCycleLaunchAnnouncement(cycle, projects)
}

async function _handleCycleLaunchError(cycle, err) {
  console.log(`Notifying moderators of chapter ${cycle.chapterId} of cycle launch error`)
  await _notifyModerators(cycle, `❗️ **Cycle Launch Error:** ${err.message}`)
}

async function _notifyModerators(cycle, message) {
  const notificationService = require('src/server/services/notificationService')

  try {
    await findModeratorsForChapter(cycle.chapterId).then(moderators => {
      moderators.forEach(moderator => notificationService.notifyUser(moderator.id, message))
    })
  } catch (err) {
    console.error('Moderator notification error:', err)
  }
}
