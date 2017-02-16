import config from 'src/config'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {findPlayersByIds} from 'src/server/db/player'

export default async function sendRetroCompletedNotification(project) {
  const chatService = require('src/server/services/chatService')

  const projectPlayers = await findPlayersByIds(project.playerIds)
  const projectPlayerUsers = await getPlayerInfo(project.playerIds)
  const players = _mergePlayerUsers(projectPlayers, projectPlayerUsers)

  return Promise.all(players.map(player => {
    const retroStatsMessage = _compilePlayerStatsMessage(player, project)

    return chatService.sendDirectMessage(player.handle, retroStatsMessage).catch(err => {
      console.error(`\n\nThere was a problem while sending stats DM to player @${player.handle}`)
      console.error('Error:', err, err.stack)
      console.error(`Message: "${retroStatsMessage}"`)
    })
  }))
}

function _mergePlayerUsers(players, users) {
  const combined = new Map()

  players.forEach(player => combined.set(player.id, Object.assign({}, player)))

  users.forEach(user => {
    const values = combined.get(user.id)
    if (values) {
      combined.set(user.id, Object.assign({}, values, user))
    }
  })

  return Array.from(combined.values())
}

function _compilePlayerStatsMessage(player, project) {
  return `**RETROSPECTIVE COMPLETE:**

  - [View Project: ${project.name}](${config.app.baseURL}/projects/${project.name})
  - [View Your Stats](${config.app.baseURL}/users/${player.handle})`
}
