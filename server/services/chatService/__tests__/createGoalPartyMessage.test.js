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
    this.apiScope = nock(config.server.chat.baseURL)
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const {createGoalPartyMessage} = require('../index')

    describe('createGoalPartyMessage()', function () {
      beforeEach(function () {
        this.createGoalParty = {
          members: 'echo, pllearns',
        }
        this.apiScope
        .post('/api/mpim.open')
        .reply(200, this.createGoalParty)
      })
    })

    it('returns the parsed response on success', function () {
      const result = createGoalPartyMessage('echo, pllearns')
      return expect(result).to.eventually.deep.equal(this.createGoalParty)
    })
  })
})
