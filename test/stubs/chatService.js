import chatService from 'src/server/services/chatService'
import {stubServiceAPIs} from './util'

const stubbedAPIs = stubServiceAPIs(chatService, {
  createChannel: () => Promise.resolve({}),
  createChannelMessage: () => Promise.resolve({}),
  createDirectMessage: () => Promise.resolve({}),
  createResponseMessage: () => Promise.resolve({}),
  deactivateUser: () => Promise.resolve(true),
  deleteChannel: () => Promise.resolve(true),
  inviteToChannel: () => Promise.resolve({}),
  sendChannelMessage: () => Promise.resolve({}),
  sendDirectMessage: () => Promise.resolve({}),
  sendResponseMessage: () => Promise.resolve({}),
  sendMultiPartyDirectMessage: () => Promise.resolve({}),
})

export default stubbedAPIs
