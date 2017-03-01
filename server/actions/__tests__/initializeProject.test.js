/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import {stub} from 'sinon'
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
      it('creates the project channel, goal channel, and welcome messages', async function () {
        const memberHandles = this.users.map(u => u.handle)
        await initializeProject(this.project)

        expect(chatService.createChannel).to.have.been.calledWith(this.project.name, [...memberHandles, 'echo'])
        expect(chatService.createChannel).to.have.been.calledWith(String(this.project.goal.githubIssue.number), [...memberHandles, 'echo'])
        expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'Welcome to the')
        expect(chatService.sendChannelMessage).to.have.been.calledWithMatch(this.project.name, 'Your team is')
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
        secondTeamProject.goal.githubIssue.number = this.project.goal.githubIssue.number

        const expectedChannelName = String(secondTeamProject.goal.githubIssue.number)
        const secondTeamUsers = await mockIdmUsersById(secondTeamProject.playerIds)
        const secondTeamHandles = secondTeamUsers.map(u => u.handle)

        await initializeProject(secondTeamProject)
        expect(chatService.joinChannel).to.have.been.calledWith(expectedChannelName, [...secondTeamHandles, 'echo'])
      })
    })
  })
})
