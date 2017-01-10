import Promise from 'bluebird'
import * as chatService from 'src/server/services/chatService'
import {processJobs} from 'src/server/services/jobService'

export function start() {
  processJobs('chatMessageSent', processChatMessageSent)
}

export async function processChatMessageSent({msg, target, type}, chatClient = chatService) {
  console.log(`Sending chat message to ${type} [${target}]`)

  const msgs = Array.isArray(msg) ? msg : [msg]

  switch (type) {
    case 'channel':
      await Promise.each(msgs, msg => chatClient.createChannelMessage(target, msg))
      break
    case 'user':
      await Promise.each(msgs, msg => chatClient.createDirectMessage(target, msg))
      break
    default:
      console.error(`Invalid Message Type: ${type}`)
      break
  }
}
