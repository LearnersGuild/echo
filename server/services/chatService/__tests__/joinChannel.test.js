/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import stubs from 'src/test/stubs'

//   '/api/channels.join'    {token, name} --> {ok, channel:{...}}

describe.only(testContext(__filename), function () {
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

    const { joinChannel } = require('../index')

    describe('joinChannel()', function () {
      beforeEach(function () {
        this.name = 'perfect-penguin'
        this.responses.joinChannel = {
          name: this.name
        }
        this.apiScope
          .post('/api/channels.join')
          .reply(200, {
            ok: true,
            channel: this.responses.joinChannel
          })
      })

      it('returns the parsed response on success', function () {
        const result = joinChannel(this.name)
        return expect(result).to.eventually.deep.equal(this.responses.joinChannel)
      })
    })
  })
})
