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
    const {getUserList} = require('../index')

    describe('getUserList()', function () {
      beforeEach(function () {
        this.users = ['foo', 'bar', 'baz']
        useFixture.nockChatServiceCache([], ['foo', 'bar', 'baz'])
      })

      it('returns the user list', function () {
        const expectedUserList = this.users.map(user => ({
          id: user,
          name: user,
        }))
        const result = getUserList()
        return expect(result).to.eventually.deep.equal({
          ok: true,
          members: expectedUserList,
        })
      })
    })
  })
})
