/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import stubs from 'src/test/stubs'

describe(testContext(__filename), function () {
  beforeEach(function () {
    this.responses = {}
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const {deleteChannel} = require('../index')

    describe('deleteChannel()', function () {
      beforeEach(function () {
        this.name = 'perfect-penguin'
        this.apiScope
          .post('/api/channels.archive')
          .reply(200, {
            ok: true,
          })
      })

      it('returns true on success', function () {
        const result = deleteChannel(this.name)
        return expect(result).to.eventually.deep.equal(true)
      })
    })
  })
})
