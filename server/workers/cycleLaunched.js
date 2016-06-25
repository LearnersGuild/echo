import r from '../../db/connect'
import {getQueue, getSocket, graphQLFetcher} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {formProjectTeams} from '../../server/actions/formProjectTeams'

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')
  cycleLaunched.process(({data: cycle}) => {
    processCycleLaunch(cycle).catch(err => {
      console.error('Cycle Launch Error:', err)
      const socket = getSocket()

      return r.table('moderators')
        .getAll(cycle.chapterId, {index: 'chapterId'}).run()
        .then(moderators => {
          return Promise.all(moderators.forEach(moderator => {
            socket.publish(`notifyUser-${moderator.id}`, `Cycle Launch Error: ${err.message}`)
          }))
        })
    })
  })
}

function processCycleLaunch(cycle) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  return formProjectTeams(cycle.id)
    .then(projects => {
      return Promise.all(projects.map(project => {
        return initializeProjectChannel(project.name, project.cycleTeams[cycle.id].playerIds, project.goal)
      }))
      .then(() => {
        return sendCycleLaunchAnnouncement(cycle, projects)
      })
    })
}

function initializeProjectChannel(channelName, playerIds, goal) {
  const goalIssueNum = goal.url.replace(/.*\/(\d+)$/, '$1')
  const channelTopic = `[${goalIssueNum}: ${goal.title}](${goal.url})`
  const client = new ChatClient()
  return getPlayerHandles(playerIds)
    .then(handles => client.createChannel(channelName, handles.concat('echo'), channelTopic))
    .then(() => client.sendMessage(channelName, `Welcome to the ${channelName} project channel!`))
}

function getPlayerHandles(playerIds) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: 'query ($playerIds: [ID]!) { getUsersByIds(ids: $playerIds) { handle } }',
    variables: {playerIds},
  }).then(json => json.data.getUsersByIds.map(u => u.handle))
}

function sendCycleLaunchAnnouncement(cycle, projects) {
  const projectListString = projects.map(p => `#${p.name}`).join(', ')
  const announcement = `🚀 The cycle has been launched and the following projects have been created: ${projectListString}`
  const client = new ChatClient()

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => client.sendMessage(chapter.channelName, announcement))
}
