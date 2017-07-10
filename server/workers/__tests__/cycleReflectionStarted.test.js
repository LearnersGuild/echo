/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, mockIdmUsersById, useFixture} from 'src/test/helpers'

describe.only(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processCycleReflectionStarted()', function () {
    const chatService = require('src/server/services/chatService')
    const { processCycleReflectionStarted } = require('../cycleReflectionStarted')

    describe('when reflection has started', function () {
      beforeEach('setup data & mocks', async function () {
        useFixture.nockClean()
        this.cycle = await factory.create('cycle')
        this.phase = await factory.create('phase', {hasRetrospective: true})
        console.log("cycleId:", typeof this.cycle.id)
        this.project = await factory.create('project', {
          phaseId: this.phase.id,
          cycleId: this.cycle.id
        })
        this.users = await mockIdmUsersById(this.project.memberIds)
      })

      it('sends the cycle reflection annoucement in direct message', async function () {
        const memberHandles = this.users.map(u => u.handle)
        await processCycleReflectionStarted(this.cycle.id)
        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(this.project.memberIds, /Time to start your reflection process for cycle/)
      })

      it('sends the cycle reflection announcement in phase channel', async function () {
        await processCycleReflectionStarted(this.cycle.id)
        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.phase.channelName, /Time to start your reflection process for cycle/)
      })
    })
  })
})
