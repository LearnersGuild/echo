/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import stubs from 'src/test/stubs'
import {useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(function () {
    useFixture.nockClean()
    this.responses = {}
    this.apiScope = nock(config.server.chat.baseURL)
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const jobService = require('src/server/services/jobService')

    const {sendDirectMessage} = require('../index')

    describe('sendDirectMessage()', function () {
      beforeEach(function () {
        this.name = 'perfect-penguin'
        this.responses.sendDirectMessage = {
          name: this.name
        }
        this.apiScope
          .post('/api/chat.postMessage')
          .reply(200, {
            ok: true,
            channel: this.responses.sendDirectMessage
          })

        this.apiScope
          .post('/api/im.open')
          .reply(200, {
            user: 'pllearns'
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
    })
  })
})
