import config from 'src/config'
import {escapeMarkdownLinkTitle} from 'src/common/util'
import {renderGoalChannelName} from 'src/common/models/goal'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {LGBadRequestError} from 'src/server/util/error'

export default async function initializeProject(project) {
  const {Project} = require('src/server/services/dataService')

  project = typeof project === 'string' ? await Project.get(project) : project
  if (!project) {
    throw new LGBadRequestError(`Project ${project} not found; initialization aborted`)
  }

  console.log(`Initializing project #${project.name}`)

  return _initializeProjectChannel(project)
}

async function _initializeProjectChannel(project) {
  const chatService = require('src/server/services/chatService')
  const {goal, name: channelName} = project
  const players = await getPlayerInfo(project.playerIds)
  const goalLink = `${goal.number}`
  console.log({goalLink})
  const channelUserNames = players.map(p => p.handle).concat(config.server.chat.userName)

  try {
    await chatService.createChannel(channelName, channelUserNames, goalLink)
    await chatService.sendChannelMessage(channelName, _welcomeMessage(channelName, goalLink, players))
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      console.log(`Project channel ${channelName} already exists; initialization skipped`)
    } else {
      throw err
    }
  }

  try {
    await chatService.createChannel(channelName, channelUserNames, goalLink)
    await chatService.sendMultiPartyDirectMessage(channelName, _welcomeMessage(goalLink, players))
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      await chatService.joinChannel(goalLink, channelUserNames)
    } else {
      throw err
    }
  }
}

function _isDuplicateChannelError(error) {
  return (error.message || '').includes('error-duplicate-channel-name')
}

function _welcomeMessage(goalLink, players) {
  return `
  🎊 *Welcome to the ${goalLink} project channel!* 🎊

  *Your goal is:* ${goalLink}
  *Your team is:*
  ${channelUserNames}

  *Time to start work on your project!*

  The first step is to create an appropriate project artifact.
  Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

  Run \`/project set-artifact --help\` for more guidance.`
}
