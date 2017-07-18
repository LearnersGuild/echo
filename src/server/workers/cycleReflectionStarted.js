import {Moderator} from 'src/server/services/dataService'
import ensureCycleReflectionSurveysExist from 'src/server/actions/ensureCycleReflectionSurveysExist'
import sendCycleReflectionAnnouncements from 'src/server/actions/sendCycleReflectionAnnouncements'
import reloadDefaultModelData from 'src/server/actions/reloadDefaultModelData'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleReflectionStarted', processCycleReflectionStarted, notifyModeratorsAboutError)
}

export async function processCycleReflectionStarted(cycle) {
  console.log(`Starting reflection for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  await reloadDefaultModelData()
  await ensureCycleReflectionSurveysExist(cycle)
  console.log('LOG ONE inside processCycleReflectionStarted!')
  await sendCycleReflectionAnnouncements(cycle.id)

  console.log(`Cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId} reflection successfully started`)
}

async function notifyModeratorsAboutError(cycle, originalErr) {
  try {
    await _notifyModerators(cycle.chapterId, `❗️ **Error:** ${originalErr}`)
  } catch (err) {
    console.error(`Got this error [${err}] trying to notify moderators about this error [${originalErr}]`)
  }
}

async function _notifyModerators(chapterId, message) {
  const notificationService = require('src/server/services/notificationService')

  const chapterModerators = await Moderator.filter({chapterId})
  chapterModerators.forEach(moderator => (
    notificationService.notifyUser(moderator.id, message)
  ))
}
