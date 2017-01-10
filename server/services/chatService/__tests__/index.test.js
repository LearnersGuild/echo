/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'

import {
  login,
  createDirectMessage,
  createChannelMessage,
  createChannel,
  joinChannel,
  deleteChannel,
} from '../index'

describe(testContext(__filename), function () {
  beforeEach(function () {
    this.responses = {}
    this.responses.login = {
      data: {
        authToken: 'L7Cf5bJAcNXkRuo0ZRyu0QmjzSIcFCO1QBpKYM0nE3g',
        userId: 'L9Dnu2G2NSWm8cQpr'
      },
      status: 'success',
    }
    this.apiScope = nock(config.server.chat.baseURL)
      .post('/api/login')
      .reply(200, this.responses.login)
  })

  describe('login()', function () {
    it('returns the parsed response on success', function () {
      const result = login()
      return expect(result).to.eventually.deep.equal(this.responses.login.data)
    })
  })

  describe('createDirectMessage()', function () {
    beforeEach(function () {
      this.responses.createDirectMessage = true
      this.apiScope
        .post(`/hooks/${config.server.chat.webhookTokens.DM}`)
        .reply(200, {
          result: this.responses.createDirectMessage,
          status: 'success',
        })
    })

    it('returns the parsed response on success', function () {
      const result = createDirectMessage('someuser', 'somemessage')
      return expect(result).to.eventually.equal(this.responses.createDirectMessage)
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
          result: this.responses.createChannelMessage,
          status: 'success',
        })
    })

    it('returns the parsed response on success', function () {
      const result = createChannelMessage('channel', 'message')
      return expect(result).to.eventually.deep.equal(this.responses.createChannelMessage)
    })
  })

  describe('createChannel()', function () {
    beforeEach(function () {
      this.channelName = 'perfect-penguin'
      this.topic = '[Goal 1: lorem ipsum](http://example.com)'
      this.members = ['echo']
      this.responses.createChannel = {
        rid: 'BFWXgKacy8e4vjXJL',
        name: this.channelName,
        topic: this.topic,
        members: this.members,
      }
      this.apiScope
        .post('/api/lg/rooms')
        .reply(200, {
          status: 'success',
          room: this.responses.createChannel,
        })
    })

    it('returns the parsed response on success', function () {
      const result = createChannel(this.channelName, this.members, this.topic)
      return expect(result).to.eventually.deep.equal(this.responses.createChannel)
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

  describe('deleteChannel()', function () {
    beforeEach(function () {
      this.rooms = {
        found: 'existing-room',
        notFound: 'non-existant-room',
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
})
