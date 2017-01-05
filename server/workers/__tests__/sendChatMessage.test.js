/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  sendChatMessage,
} from 'src/server/workers/sendChatMessage'

describe(testContext(__filename), function () {
  describe('sendChatMessage()', function () {
    beforeEach('create stubs', function () {
      const recordMessageStub = type => {
        return (target, msg) => {
          this.chatClientStub.sentMessages[type][target] = this.chatClientStub.sentMessages[type][target] || []
          this.chatClientStub.sentMessages[type][target].push(msg)
          return Promise.resolve()
        }
      }

      this.chatClientStub = {
        sentMessages: {channel: {}, user: {}},
        sendChannelMessage: recordMessageStub('channel'),
        sendDirectMessage: recordMessageStub('user'),
      }
    })

    it('sends a message to the project chatroom', function () {
      const event = {type: 'channel', target: 'channel1', msg: 'this is the message'}

      return sendChatMessage(event, this.chatClientStub).then(() => {
        const [msg] = this.chatClientStub.sentMessages.channel[event.target]
        expect(msg).to.eq(event.msg)
      })
    })

    it('accepts an array of messages', function () {
      const event = {type: 'channel', target: 'channel1', msg: ['msg1', 'msg2']}

      return sendChatMessage(event, this.chatClientStub).then(() => {
        const msgs = this.chatClientStub.sentMessages.channel[event.target]
        expect(msgs).to.deep.eq(event.msg)
      })
    })

    it('sends a DM to each player', function () {
      const event = {type: 'user', target: 'steve', msg: 'this is the message'}

      return sendChatMessage(event, this.chatClientStub).then(() => {
        const [msg] = this.chatClientStub.sentMessages.user[event.target]
        expect(msg).to.deep.eq(event.msg)
      })
    })
  })
})

