/* eslint-disable prefer-arrow-callback */
import Promise from 'bluebird'
import {getQueue, processJobs} from 'src/server/util/queue'
import {formProjectsIfNoneExist} from 'src/server/actions/formProjects'
import sendCycleLaunchAnnouncement from 'src/server/actions/sendCycleLaunchAnnouncement'
import {findModeratorsForChapter} from 'src/server/db/moderator'
import {findProjects} from 'src/server/db/project'
import {getSocket} from 'src/server/util/socket'
import ChatClient from 'src/server/clients/ChatClient'

export function start() {
  processJobs('cycleLaunched', processCycleLaunch, _handleCycleLaunchError)
}

export async function processCycleLaunch(cycle, options = {}) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  const chatClient = options.chatClient || new ChatClient()

  await formProjectsIfNoneExist(cycle.id, err => _notifyModerators(cycle, `⚠️ ${err.message}`))
  const projects = await findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})

  await Promise.each(projects, ({id}) => _queueProjectCreatedEvent(id))

  return sendCycleLaunchAnnouncement(cycle, projects, {chatClient})
}

async function _handleCycleLaunchError(cycle, err) {
  console.log(`Notifying moderators of chapter ${cycle.chapterId} of cycle launch error`)
  await _notifyModerators(cycle, `❗️ **Cycle Launch Error:** ${err.message}`)
}

async function _notifyModerators(cycle, message) {
  try {
    const socket = getSocket()
    await findModeratorsForChapter(cycle.chapterId).then(moderators => {
      moderators.forEach(moderator => {
        socket.publish(`notifyUser-${moderator.id}`, message)
      })
    })
  } catch (err) {
    console.error('Moderator notification error:', err)
  }
}

function _queueProjectCreatedEvent(projectId) {
  const projectCreatedQueue = getQueue('projectCreated')
  return projectCreatedQueue.add({projectId}, {
    attempts: 5,
    backoff: {type: 'exponential', delay: 1000},
  })
}
