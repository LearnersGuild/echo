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

    const {
      sendChannelMessage,
      sendDirectMessage,
      sendMultiPartyDirectMessage,
      sendResponseMessage,
    } = require('../index')

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

    describe('sendDirectMessage()', function () {
      it('queues the correct chat message job', async function () {
        const userName = 'supausah'
        const userMessage = 'this is mah usah msg'
        await sendDirectMessage(userName, userMessage)
        expect(jobService.createJob).to.have.been.calledWith('chatMessageSent', {
          type: 'user',
          target: userName,
          msg: userMessage,
        })
      })
    })

    describe('sendMultiPartyDirectMessage()', function () {
      it('queues the correct chat message job', async function () {
        const userNames = ['supausah', 'supsuckah']
        const userMessage = 'this is mah usah msg'
        await sendMultiPartyDirectMessage(userNames, userMessage)
        expect(jobService.createJob).to.have.been.calledWith('chatMessageSent', {
          type: 'group',
          target: userNames,
          msg: userMessage,
        })
      })
    })

    describe('sendResponseMessage()', function () {
      it('queues the correct chat message job', async function () {
        const responseURL = 'https://hooks.exmaple.com/commands/ABCD1234/ABCD1234ZYXW9876'
        const response = {text: 'this is mah usah msg'}
        await sendResponseMessage(responseURL, response)
        expect(jobService.createJob).to.have.been.calledWith('chatMessageSent', {
          type: 'response',
          target: responseURL,
          msg: response,
        })
      })
    })
  })
})
