/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

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
      createChannel,
      createChannelMessage,
      createDirectMessage,
      deleteChannel,
      joinChannel,
      sendChannelMessage,
      sendDirectMessage,
    } = require('../index')

    describe('createChannel()', function () {
      beforeEach(function () {
        this.name = 'perfect-penguin'
        this.topic = '[Goal 1: lorem ipsum](http://example.com)'
        this.members = ['echo']
        this.responses.createChannel = {
          id: 'BFWXgKacy8e4vjXJL',
          name: this.name,
          members: this.members,
          topic: this.topic,
        }
        this.apiScope
          .post('/api/channels.create')
          .reply(200, {
            ok: true,
            channel: this.responses.createChannel,
          })
      })

      it('returns the parsed response on success', function () {
        const result = createChannel(this.name, this.members, this.topic)
        return expect(result).to.eventually.deep.equal(this.responses.createChannel)
      })
    })

    describe('createChannelMessage()', function () {
      beforeEach(function () {
        this.responses.createChannelMessage = {
          _id: '79ugwPTBQ65EHw6BD',
          msg: 'the message',
          rid: 'cRSDeB4a5ePSNSMby',
          ts: '2016-05-20T12:28:12.064Z',
          u: {
            _id: 'L9Dnu2G2NSWm8cQpr',
            username: 'echo'
          }
        }
        this.apiScope
          .post('/api/lg/rooms/channel/send')
          .reply(200, {
            status: 'success',
            result: this.responses.createChannelMessage,
          })
      })

      it('returns the parsed response on success', function () {
        const result = createChannelMessage('channel', 'message')
        return expect(result).to.eventually.deep.equal(this.responses.createChannelMessage)
      })
    })

    describe('createDirectMessage()', function () {
      beforeEach(function () {
        this.responses.createDirectMessage = true
        this.apiScope
          .post(`/hooks/${config.server.chat.webhookTokens.DM}`)
          .reply(200, {
            status: 'success',
            data: this.responses.createDirectMessage,
          })
      })

      it('returns the parsed response on success', function () {
        const result = createDirectMessage('someuser', 'somemessage')
        return expect(result).to.eventually.equal(this.responses.createDirectMessage)
      })
    })

    describe('deleteChannel()', function () {
      beforeEach(function () {
        this.rooms = {
          found: 'found-room',
          notFound: 'not-found-room',
        }
        this.apiScope.delete(`/api/lg/rooms/${this.rooms.found}`)
          .reply(200, {
            status: 'success',
            result: 1,
          })
        this.apiScope.delete(`/api/lg/rooms/${this.rooms.notFound}`)
          .reply(500, {
            status: 'fail',
            message: "TypeError::Cannot read property '_id' of undefined",
          })
      })

      it('returns true if the channel exists', function () {
        const result = deleteChannel(this.rooms.found)
        return expect(result).to.eventually.equal(true)
      })

      it('throws an error if the channel does not exist', function () {
        const result = deleteChannel(this.rooms.notFound)
        return expect(result).to.be.rejected
      })
    })

    describe('joinChannel()', function () {
      beforeEach(function () {
        this.channelName = 'perfect-penguin'
        this.members = ['echo']
        this.responses.joinChannel = {
          room: this.channelName,
          usersJoined: this.members,
          alreadyInRoom: [],
        }
        this.apiScope
          .post(`/api/lg/rooms/${this.channelName}/join`)
          .reply(200, {
            status: 'success',
            result: this.responses.joinChannel,
          })
      })

      it('returns the parsed response on success', function () {
        const result = joinChannel(this.channelName, this.members)
        return expect(result).to.eventually.deep.equal(this.responses.joinChannel)
      })
    })

    describe('sendChannelMessage()', function () {
      it('queues the correct chat message job', async function () {
        const channelName = 'supachannel'
        const channelMessage = 'this is mah channel msg'
        await sendChannelMessage(channelName, channelMessage)
        expect(jobService.createJob).to.have.been.calledWith('chatMessageSent', {
          type: 'channel',
          target: channelName,
          msg: channelMessage,
        })
      })
    })

    describe('sendDirectMessage()', function () {
      it('queues the correct chat message job', async function () {
        const userName = 'supausah'
        const userMessage = 'this is mah usah msg'
        await sendDirectMessage(userName, userMessage)
        expect(jobService.createJob).to.have.been.calledWith('chatMessageSent', {
          type: 'user',
          target: userName,
          msg: userMessage,
        })
      })
    })
  })
})
