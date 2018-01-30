 /* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, mockIdmUsersById, useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processCycleReflectionStarted()', function () {
    const chatService = require('src/server/services/chatService')

    const {processCycleReflectionStarted} = require('../cycleReflectionStarted')

    beforeEach('setup data & mocks', async function () {
      useFixture.nockClean()
      this.cycle = await factory.create('cycle', {state: 'PRACTICE'})
      this.phase = await factory.create('phase')
      this.project = await factory.create('project', {
        phaseId: this.phase.id,
        cycleId: this.cycle.id,
      })
      const members = this.project.memberIds.map(memberId => ({id: memberId, phaseId: this.phase.id}))
      this.users = await mockIdmUsersById(this.project.memberIds, members, {times: 10})
    })

    it('sends the cycle reflection announcement in direct message to phase project members', async function () {
      const memberHandles = this.users.map(u => u.handle)
      await processCycleReflectionStarted(this.cycle)
      expect(chatService.sendDirectMessage).to.have.been
        .calledWithMatch(memberHandles, 'Time to start your reflection process for cycle')
    })

    it('sends the cycle reflection announcement in phase channel', async function () {
      await processCycleReflectionStarted(this.cycle)
      expect(chatService.sendChannelMessage).to.have.been
        .calledWithMatch(this.phase.channelName, 'Time to start your reflection process for cycle')
    })
  })
})
