import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export default async function initializeProject(project) {
  const {Project} = require('src/server/services/dataService')

  project = typeof project === 'string' ? await Project.get(project) : project
  if (!project) {
    throw new Error(`Project ${project} not found; initialization aborted`)
  }

  console.log(`Initializing project #${project.name}`)

  return _initializeProjectChannel(project)
}

async function _initializeProjectChannel(project) {
  const chatService = require('src/server/services/chatService')

  const {goal, name: channelName} = project
  const players = await getPlayerInfo(project.playerIds)
  const goalIssueNum = goal.url.replace(/.*\/(\d+)$/, '$1')
  const goalLink = `[${goalIssueNum}: ${goal.title}](${goal.url})`

  try {
    await chatService.createChannel(channelName, players.map(p => p.handle).concat('echo'), goalLink)

    // split welcome message into 2 so the goal link preview appears after the goal link
    await chatService.sendChannelMessage(channelName, _welcomeMessage1(channelName, goalLink))
    await chatService.sendChannelMessage(channelName, _welcomeMessage2(players))
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      console.log(`Project channel ${channelName} already exists; initialization skipped`)
    } else {
      throw err
    }
  }
}

function _isDuplicateChannelError(error) {
  return (error.message || '').includes('already exists')
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
