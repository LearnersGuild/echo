/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

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
    const {inviteToChannel} = require('../index')

    describe('inviteToChannel()', function () {
      beforeEach(function () {
        this.users = ['me', 'you', 'someone-else']
        this.channel = 'perfect-penguin'
        useFixture.nockChatServiceCache([this.channel], this.users)
        this.responses.inviteToChannel = {
          name: this.channel
        }
        this.apiScope
          .persist()
          .post('/api/channels.invite')
          .reply(200, {
            ok: true,
            channel: this.responses.inviteToChannel
          })
      })

      it('returns the parsed response on success', function () {
        const expectedResult = this.users.map(() => this.responses.inviteToChannel)
        const result = inviteToChannel(this.channel, this.users)
        return expect(result).to.eventually.deep.equal(expectedResult)
      })
    })
  })
})
