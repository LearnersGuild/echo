import Promise from 'bluebird'

import {connect} from 'src/db'
import {findProjects} from 'src/server/db/project'
import {findModeratorsForChapter} from 'src/server/db/moderator'
import ensureCycleReflectionSurveysExist from 'src/server/actions/ensureCycleReflectionSurveysExist'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'
import {sendChannelMessage} from 'src/server/services/chatService'
import {notifyUser} from 'src/server/services/notificationService'
import {processJobs} from 'src/server/services/jobService'

const r = connect()

export function start() {
  processJobs('cycleReflectionStarted', processCycleReflectionStarted, notifyModeratorsAboutError)
}

async function processCycleReflectionStarted(cycle) {
  console.log(`Starting reflection for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  await reloadSurveyAndQuestionData()
  await ensureCycleReflectionSurveysExist(cycle)
  await _sendStartReflectionAnnouncement(cycle)

  console.log(`Cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId} reflection successfully started`)
}

async function _sendStartReflectionAnnouncement(cycle) {
  const announcement = `🤔  *Time to start your reflection process for cycle ${cycle.cycleNumber}*!\n`
  const reflectionInstructions = 'To get started check out `/retro --help` and `/review --help`'

  const chapter = await r.table('chapters').get(cycle.chapterId)
  await Promise.all([
    _createChapterAnnoucement(chapter, announcement + reflectionInstructions),
    _createProjectAnnouncements(cycle, announcement + reflectionInstructions),
  ])
}

async function notifyModeratorsAboutError(cycle, originalErr) {
  try {
    await _notifyModerators(cycle.chapterId, `❗️ **Error:** ${originalErr}`)
  } catch (err) {
    console.error(`Got this error [${err}] trying to notify moderators about this error [${originalErr}]`)
  }
}

function _notifyModerators(chapterId, message) {
  return findModeratorsForChapter(chapterId).then(moderators => {
    moderators.forEach(moderator => notifyUser(moderator.id, message))
  })
}

function _createChapterAnnoucement(chapter, message) {
  return sendChannelMessage(chapter.channelName, message)
}

function _createProjectAnnouncements(cycle, message) {
  return findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
    .then(projects => Promise.map(projects, project => (
      sendChannelMessage(project.name, message)
    )))
}
