import config from 'src/config'
import findMemberUsers from 'src/server/actions/findMemberUsers'

export default async function sendRetroCompletedNotification(project) {
  const chatService = require('src/server/services/chatService')

  const projectMemberUsers = await findMemberUsers(project.memberIds)

  return Promise.all(projectMemberUsers.map(memberUser => {
    const retroNotificationMessage = _compileMemberNotificationMessage(project)
    const memberChatUsername = memberUser.handle
    return chatService.sendDirectMessage(memberChatUsername, retroNotificationMessage).catch(err => {
      console.error(`There was a problem while sending a retro notification to chat user @${memberChatUsername}`)
      console.error('Error:', err, err.stack)
      console.error(`Message: "${retroNotificationMessage}"`)
    })
  }))
}

function _compileMemberNotificationMessage(project) {
  return (
    `**RETROSPECTIVE COMPLETE:**

    [View Project: ${project.name}](${config.app.baseURL}/projects/${project.name})`
  )
}
