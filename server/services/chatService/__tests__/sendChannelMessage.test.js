/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import stubs from 'src/test/stubs'

describe(testContext(__filename), function () {
  beforeEach(function () {
    this.responses = {}
    this.apiScope = nock(config.server.chat.baseURL)
      .post('/api/login')
      .reply(200, {
        status: 'success',
        data: {
          authToken: 'L7Cf5bJAcNXkRuo0ZRyu0QmjzSIcFCO1QBpKYM0nE3g',
          userId: 'L9Dnu2G2NSWm8cQpr'
        },
      })
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const jobService = require('src/server/services/jobService')

    const {sendChannelMessage} = require('../index')

    describe('sendChannelMessage()', function () {
      beforeEach(function () {
        this.name = 'perfect-penguin'
        this.responses.sendChannelMessage = {
          name: this.name
        }
        this.apiScope
          .post('/api/chat.postMessage')
          .reply(200, {
            ok: true,
            channel: this.responses.sendChannelMessage
          })
      })

      describe('sendChannelMessage()', function () {
        it('queues the correct chat message job', async function () {
          const channelName = 'supachannel'
          const channelMessage = 'this is mah channel msg'
          await sendChannelMessage(channelName, channelMessage)
          expect(jobService.createJob).to.have.been.calledWith('chatMessageSent', {
            type: 'channel',
            target: channelName,
            msg: channelMessage,
          })
        })
      })
    })
  })
})
