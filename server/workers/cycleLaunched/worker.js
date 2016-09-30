import raven from 'raven'

import config from 'src/config'
import r from 'src/db/connect'
import {formProjects} from 'src/server/actions/formProjects'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {findModeratorsForChapter} from 'src/server/db/moderator'
import {getTeamPlayerIds, getProjectsForChapterInCycle} from 'src/server/db/project'
import {update as updateCycle} from 'src/server/db/cycle'
import {parseQueryError} from 'src/server/db/errors'
import {CYCLE_STATES} from 'src/common/models/cycle'
import {getQueue, getSocket} from 'src/server/util'
import ChatClient from 'src/server/clients/ChatClient'

const sentry = new raven.Client(config.server.sentryDSN)

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')

  cycleLaunched.LOCK_RENEW_TIME = 60 * 60000

  cycleLaunched.process(async function({data: cycle}) {
    try {
      await processCycleLaunch(cycle)
      console.log(`Cycle ${cycle.id} successfully launched`)
    } catch (err) {
      console.error('Cycle launch error:', err.stack)
      await _handleCycleLaunchError(cycle, err)
    }
  })
}

export async function processCycleLaunch(cycle, options = {}) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  const chatClient = options.chatClient || new ChatClient()

  await formProjects(cycle.id)
  const projects = await getProjectsForChapterInCycle(cycle.chapterId, cycle.id)

  await Promise.all(projects.map(project => {
    return initializeProjectChannel(chatClient, project.name, getTeamPlayerIds(project, cycle.id), project.goal)
  }))

  return sendCycleLaunchAnnouncement(chatClient, cycle, projects)
}

async function initializeProjectChannel(chatClient, channelName, playerIds, goal) {
  console.log(`Initializing project channel ${channelName}`)
  const goalIssueNum = goal.url.replace(/.*\/(\d+)$/, '$1')
  const goalLink = `[${goalIssueNum}: ${goal.title}](${goal.url})`

  const players = await getPlayerInfo(playerIds)
  await chatClient.createChannel(channelName, players.map(p => p.handle).concat('echo'), goalLink)

  // Split welcome message into 2 so that the goal link preview
  // is inserted right after the goal link.
  const projectWelcomeMessage1 = `🎊 *Welcome to the ${channelName} project channel!* 🎊

*Your goal is:* ${goalLink}
`

  const projectWelcomeMessage2 = `*Your team is:*
  ${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

The first step is to create an appropriate project artifact.
Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.
`

  await chatClient.sendChannelMessage(channelName, projectWelcomeMessage1)
  await chatClient.sendChannelMessage(channelName, projectWelcomeMessage2)
}

function sendCycleLaunchAnnouncement(chatClient, cycle, projects) {
  const projectListString = projects.map(p => `#${p.name} - _${p.goal.title}_`).join('\n  • ')
  const announcement = `🚀  *The cycle has been launched!*
The following projects have been created:
  • ${projectListString}`

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => chatClient.sendChannelMessage(chapter.channelName, announcement))
}

async function _handleCycleLaunchError(cycle, err) {
  sentry.captureException(err)
  err = parseQueryError(err)

  const socket = getSocket()

  try {
    // reset cycle state to GOAL_SELECTION
    console.log(`Resetting state for cycle ${cycle.id} to GOAL_SELECTION`)
    const goalSelectionCycleState = CYCLE_STATES[0] // FIXME: yuck!
    await updateCycle({id: cycle.id, state: goalSelectionCycleState})
  } catch (err) {
    console.error('Cycle state reset error:', err)
  }

  // delete any projects that were created
  await getProjectsForChapterInCycle(cycle.chapterId, cycle.id).delete()

  try {
    console.log(`Notifying moderators of chapter ${cycle.chapterId} of cycle launch error`)
    await findModeratorsForChapter(cycle.chapterId).then(moderators => {
      moderators.forEach(moderator => {
        socket.publish(`notifyUser-${moderator.id}`, `❗️ **Cycle Launch Error:** ${err.message}`)
      })
    })
  } catch (err) {
    console.error('Moderator notification error:', err)
  }
}
