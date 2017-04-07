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
    const {createMultiPartyDirectMessage} = require('../index')

    describe('createMultiPartyDirectMessage()', function () {
      beforeEach(function () {
        this.apiScope
          .post('/api/mpim.open')
          .reply(200, {
            ok: true,
            group: {id: '12345'},
            members: ['echo', 'pllearns'],
          })
          .post('/api/chat.postMessage')
          .reply(200, {
            ok: true,
            channel: '12345',
            text: 'Rubber Baby Buggy Bumpers',
          })
      })

      it('returns the parsed response on success', function () {
        const result = createMultiPartyDirectMessage(['echo', 'pllearns'], 'Rubber Baby Buggy Bumpers')
        return expect(result).to.eventually.deep.equal(true)
      })
    })
  })
})
