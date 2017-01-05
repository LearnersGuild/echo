import Promise from 'bluebird'
import ChatClient from 'src/server/clients/ChatClient'
import {processJobs} from 'src/server/util/queue'

export function start() {
  processJobs('sendChatMessage', sendChatMessage)
}

export async function sendChatMessage({msg, target, type}, chatClient = new ChatClient()) {
  console.log(`Sending chat message to ${type} [${target}]`)

  const msgs = Array.isArray(msg) ? msg : [msg]

  switch (type) {
    case 'channel':
      await Promise.each(msgs, msg => chatClient.sendChannelMessage(target, msg))
      break
    case 'user':
      await Promise.each(msgs, msg => chatClient.sendDirectMessage(target, msg))
      break
    default:
      console.error(`Invalid Message Type: ${type}`)
      break
  }
}
