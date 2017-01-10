import {stub} from 'sinon'

import chatService from 'src/server/services/chatService'

export default {
  enable() {
    stub(chatService, 'createChannel', () => Promise.resolve({}))
    stub(chatService, 'createChannelMessage', () => Promise.resolve({}))
    stub(chatService, 'createDirectMessage', () => Promise.resolve({}))
    stub(chatService, 'deleteChannel', () => Promise.resolve({}))
    stub(chatService, 'joinChannel', () => Promise.resolve({}))
    stub(chatService, 'sendChannelMessage', () => Promise.resolve({}))
    stub(chatService, 'sendDirectMessage', () => Promise.resolve({}))
  },

  disable() {
    chatService.createChannel.restore()
    chatService.createChannelMessage.restore()
    chatService.createDirectMessage.restore()
    chatService.deleteChannel.restore()
    chatService.joinChannel.restore()
    chatService.sendChannelMessage.restore()
    chatService.sendDirectMessage.restore()
  },
}
