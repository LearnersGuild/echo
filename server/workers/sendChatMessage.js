import ChatClient from 'src/server/clients/ChatClient'
import {processJobs} from 'src/server/util/queue'

export function start() {
  processJobs('sendChatMessage', sendChatMessage)
}

export async function sendChatMessage(event, chatClient = new ChatClient()) {
  console.log(`Sending chat message to ${event.type} [${event.target}]`)

  switch (event.type) {
    case 'channel':
      await chatClient.sendChannelMessage(event.target, event.msg)
      break
    case 'user':
      await chatClient.sendDirectMessage(event.target, event.msg)
      break
    default:
      console.error(`Invalid Message Type: ${event.type}`)
      break
  }
}
