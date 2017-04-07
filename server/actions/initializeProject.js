import config from 'src/config'
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
  const {goal} = project
  const players = await getPlayerInfo(project.playerIds)
  const goalLink = `<${goal.url}|${goal.number}: ${goal.title}>`
  const channelUserNames = players.map(p => p.handle).concat(config.server.chat.userName)

  await chatService.sendMultiPartyDirectMessage(channelUserNames, _welcomeMessage(project, goalLink, players))

  try {
    await chatService.createChannel(String(goal.number), channelUserNames, goalLink)
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      await chatService.joinChannel(String(goal.number), channelUserNames)
    } else {
      throw err
    }
  }
}

// TODO -- figure out how Slack reports duplicate channels
function _isDuplicateChannelError(error) {
  return (error.message || '').includes('error-duplicate-channel-name')
}

function _welcomeMessage(project, goalLink, players) {
  return `
🎊 *Welcome to the ${project.name} project!* 🎊

*Your goal is:* ${goalLink}

*Your team is:*
${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

The first step is to create an appropriate project artifact.
Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.`
}
