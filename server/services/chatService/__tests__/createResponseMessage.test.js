/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import stubs from 'src/test/stubs'
import {useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(function () {
    useFixture.nockClean()
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const {createResponseMessage} = require('../index')

    describe('createResponseMessage()', function () {
      beforeEach(function () {
        const responseBaseURL = 'http://hooks.example.com'
        const responsePath = '/commands/T3QBMPPQT/165194302421/xGckRInmTacCvVvZ1aqaeaYc'
        this.responseURL = `${responseBaseURL}${responsePath}`
        nock(responseBaseURL)
          .post(responsePath)
          .reply(200, {
            ok: true,
          })
      })

      it('throws an error if the responseURL is invalid', function () {
        const result = createResponseMessage('this-is-not-a-url', {text: '1337hax0r'})
        return expect(result).to.eventually.be.rejectedWith(/absolute urls are supported/i)
      })

      it('returns true on success', function () {
        const result = createResponseMessage(this.responseURL, {text: '1337hax0r'})
        return expect(result).to.eventually.equal(true)
      })
    })
  })
})
