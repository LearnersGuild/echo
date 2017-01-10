/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {processChatMessageSent} from '../chatMessageSent'

describe(testContext(__filename), function () {
  describe('processChatMessageSent()', function () {
    beforeEach('create stubs', function () {
      const recordMessageStub = type => {
        return (target, msg) => {
          this.chatClientStub.createdMessages[type][target] = this.chatClientStub.createdMessages[type][target] || []
          this.chatClientStub.createdMessages[type][target].push(msg)
          return Promise.resolve()
        }
      }

      this.chatClientStub = {
        createdMessages: {channel: {}, user: {}},
        createChannelMessage: recordMessageStub('channel'),
        createDirectMessage: recordMessageStub('user'),
      }
    })

    it('sends a message to the project chatroom', function () {
      const event = {type: 'channel', target: 'channel1', msg: 'this is the message'}

      return processChatMessageSent(event, this.chatClientStub).then(() => {
        const [msg] = this.chatClientStub.createdMessages.channel[event.target]
        expect(msg).to.eq(event.msg)
      })
    })

    it('accepts an array of messages', function () {
      const event = {type: 'channel', target: 'channel1', msg: ['msg1', 'msg2']}

      return processChatMessageSent(event, this.chatClientStub).then(() => {
        const msgs = this.chatClientStub.createdMessages.channel[event.target]
        expect(msgs).to.deep.eq(event.msg)
      })
    })

    it('sends a DM to each player', function () {
      const event = {type: 'user', target: 'steve', msg: 'this is the message'}

      return processChatMessageSent(event, this.chatClientStub).then(() => {
        const [msg] = this.chatClientStub.createdMessages.user[event.target]
        expect(msg).to.deep.eq(event.msg)
      })
    })
  })
})
