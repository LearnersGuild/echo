/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
// import stubs from 'src/test/stubs'
import {useFixture} from 'src/test/helpers'

describe.skip(testContext(__filename), function () {
  beforeEach(function () {
    useFixture.nockClean()
    this.apiScope = nock(config.server.chat.baseURL)
    // stubs.jobService.enable()
  })
  afterEach(function () {
    // stubs.jobService.disable()
  })

  describe('chatService', function () {
    const {setChannelTopic} = require('../index')

    describe('setChannelTopic()', function () {
      beforeEach(function () {
        this.name = 'courageous-cow'
        this.topic = '[SuperKewl](http://kewl.com)'
        this.apiScope
          .post('/api/channels.setTopic')
          .reply(200, {
            ok: true,
            topic: this.topic,
          })
      })

      it('returns the parsed response on success', function () {
        const result = setChannelTopic(this.name, this.topic)
        return expect(result).to.eventually.deep.equal({
          ok: true,
          topic: this.topic,
        })
      })
    })
  })
})
