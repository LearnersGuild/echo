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
    const {getChannelList} = require('../index')

    describe('getChannelList()', function () {
      beforeEach(function () {
        this.channels = ['foo', 'bar', 'baz']
        useFixture.nockChatServiceCache(['foo', 'bar', 'baz'])
      })

      it('returns the channel list', function () {
        const expectedChannelList = this.channels.map(channel => ({
          id: channel,
          name: channel,
        }))
        const result = getChannelList()
        return expect(result).to.eventually.deep.equal({
          ok: true,
          channels: expectedChannelList,
        })
      })
    })
  })
})
