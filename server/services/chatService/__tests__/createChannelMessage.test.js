import nock from 'nock'

import config from 'src/config'
import stubs from 'src/test/stubs'

describe(testContext(__filename), function () {
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

    const {
      createChannelMessage,
    } = require('../index')

    describe('createChannelMessage()', function () {
      beforeEach(function () {
        this.apiScope
          .post('/api/chat.postMessage')
          .reply(200, {
            ok: true,
            channel: '12345',
          })
      })

    it('returns the parsed response on success', function () {
        const result = createChannelMessage('channelName', 'message')
        return expect(result).to.eventually.deep.equal('12345')
      })
    })
  })
})
