import Promise from 'bluebird'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('chatMessageSent', processChatMessageSent)
}

export async function processChatMessageSent({msg, target, type}) {
  const chatService = require('src/server/services/chatService')

  console.log(`Sending chat message to ${type} [${target}]`)

  const msgs = Array.isArray(msg) ? msg : [msg]

  switch (type) {
    case 'channel':
      await Promise.each(msgs, msg => chatService.createChannelMessage(target, msg))
      break
    case 'user':
      await Promise.each(msgs, msg => chatService.createDirectMessage(target, msg))
      break
    default:
      console.error(`Invalid Message Type: ${type}`)
      break
  }
}
