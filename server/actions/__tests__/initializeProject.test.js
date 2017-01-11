/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup, mockIdmUsersById} from 'src/test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('initializeProject()', function () {
    const {Player} = require('src/server/services/dataService')
    const chatService = require('src/server/services/chatService')

    const initializeProject = require('../initializeProject')

    beforeEach('setup data & mocks', async function () {
      this.project = await factory.create('project')
      this.players = await Player.getAll(...this.project.playerIds)
      this.users = await mockIdmUsersById(this.project.playerIds)
    })

    it('creates the project channel and welcome messages', async function () {
      const memberHandles = this.users.map(u => u.handle)
      await initializeProject(this.project)
      expect(chatService.createChannel).to.have.been.calledWith(this.project.name, [...memberHandles, 'echo'])
      expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'Welcome to the')
      expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'Your team is')
    })
  })
})
