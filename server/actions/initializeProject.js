import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import * as chatService from 'src/server/services/chatService'
import {Project} from 'src/server/services/dataService'

export default async function initializeProject(project, options) {
  project = typeof project === 'string' ? await Project.get(project) : project
  console.log(`Initializing project #${project.name}`)
  return _initializeProjectChannel(project, options)
}

async function _initializeProjectChannel(project, options = {}) {
  const {goal, name: channelName} = project
  const chatClient = options.chatClient || chatService

  const players = await getPlayerInfo(project.playerIds)

  const goalIssueNum = goal.url.replace(/.*\/(\d+)$/, '$1')
  const goalLink = `[${goalIssueNum}: ${goal.title}](${goal.url})`

  try {
    await chatClient.createChannel(channelName, players.map(p => p.handle).concat('echo'), goalLink)

    // split welcome message into 2 so the goal link preview appears after the goal link
    await chatClient.sendChannelMessage(channelName, _welcomeMessage1(channelName, goalLink))
    await chatClient.sendChannelMessage(channelName, _welcomeMessage2(players))
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      console.log(`Project channel ${channelName} already exists; initialization skipped`)
    } else {
      throw err
    }
  }
}

async function _isDuplicateChannelError(error) {
  return (error.message || '').contains('already exists')
}

function _welcomeMessage1(channelName, goalLink) {
  return `
🎊 *Welcome to the ${channelName} project channel!* 🎊

*Your goal is:* ${goalLink}`
}

function _welcomeMessage2(players) {
  return `
*Your team is:*
${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

The first step is to create an appropriate project artifact.
Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.`
}
