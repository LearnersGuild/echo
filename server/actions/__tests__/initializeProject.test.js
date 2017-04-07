/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {stub} from 'sinon'

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
    beforeEach('setup data & mocks', async function () {
      this.project = await factory.create('project')
      this.users = await mockIdmUsersById(this.project.playerIds)
    })
    const chatService = require('src/server/services/chatService')
    const initializeProject = require('../initializeProject')

    describe('when there is no goal channel', function () {
      it('creates the goal channel, and sends welcome message', async function () {
        const memberHandles = this.users.map(u => u.handle)
        await initializeProject(this.project)

        expect(chatService.createChannel).to.have.been.calledWith(String(this.project.goal.number), [...memberHandles, 'echo']) // eslint-disable-line camelcase
        expect(chatService.sendMultiPartyDirectMessage).to.have.been.calledWithMatch([...memberHandles, 'echo'], 'Welcome to the')
      })
    })

    describe('when there is already a goal channel', function () {
      beforeEach('alter the createChannel stub', async function () {
        chatService.createChannel.restore()
        stub(chatService, 'createChannel', () => {
          throw new Error('error-duplicate-channel-name')
        })
      })

      it('adds the new project\'s members to the goal channel', async function () {
        await initializeProject(this.project)

        const secondTeamProject = await factory.create('project')
        secondTeamProject.goal = this.project.goal

        const secondTeamUsers = await mockIdmUsersById(secondTeamProject.playerIds)
        const secondTeamHandles = secondTeamUsers.map(u => u.handle)

        await initializeProject(secondTeamProject)
        expect(chatService.joinChannel).to.have.been.calledWith(String(secondTeamProject.goal.number), [...secondTeamHandles, 'echo'])
      })
    })
  })
})
