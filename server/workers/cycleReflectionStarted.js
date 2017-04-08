import Promise from 'bluebird'

import {connect} from 'src/db'
import {mapById} from 'src/common/util'
import {findProjects} from 'src/server/db/project'
import {findModeratorsForChapter} from 'src/server/db/moderator'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import ensureCycleReflectionSurveysExist from 'src/server/actions/ensureCycleReflectionSurveysExist'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

const r = connect()

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleReflectionStarted', processCycleReflectionStarted, notifyModeratorsAboutError)
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
  await _createReflectionAnnoucements(chapter, cycle, announcement + reflectionInstructions)
}

async function notifyModeratorsAboutError(cycle, originalErr) {
  try {
    await _notifyModerators(cycle.chapterId, `❗️ **Error:** ${originalErr}`)
  } catch (err) {
    console.error(`Got this error [${err}] trying to notify moderators about this error [${originalErr}]`)
  }
}

function _notifyModerators(chapterId, message) {
  const notificationService = require('src/server/services/notificationService')

  return findModeratorsForChapter(chapterId).then(moderators => {
    moderators.forEach(moderator => notificationService.notifyUser(moderator.id, message))
  })
}

async function _createReflectionAnnoucements(chapter, cycle, message) {
  const chatService = require('src/server/services/chatService')
  const projects = await findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})

  // get all user info from IDM in one fell swoop
  const allPlayerIds = projects.reduce((result, project) => {
    result = result.concat(project.playerIds)
    return result
  }, [])
  const allUsersById = mapById(
    await getPlayerInfo(allPlayerIds)
  )

  const multiPartyDMPromises = projects.map(project => {
    const handles = project.playerIds.map(playerId => allUsersById.get(playerId).handle)
    return chatService.sendMultiPartyDirectMessage(handles, message)
  })

  return Promise.all([
    chatService.sendChannelMessage(chapter.channelName, message),
    ...multiPartyDMPromises,
  ])
}
