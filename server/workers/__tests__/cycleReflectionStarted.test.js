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
    const {processCycleReflectionStarted} = require('../cycleReflectionStarted')

    describe('when reflection has started', function () {
      describe('for phases having retrospective', function () {
        beforeEach('setup data & mocks', async function () {
          useFixture.nockClean()
          this.cycle = await factory.create('cycle', {state: 'PRACTICE'})
          this.phaseWithRetrospective = await factory.create('phase', {
            hasRetrospective: true,
            channelName: '#phase-channel-4'
          })
          this.phaseNoRetrospective = await factory.create('phase', {
            hasRetrospective: false,
            channelName: '#phase-channel-2'
          })
          this.projectWithRetrospective = await factory.createMany('project', {
            phaseId: this.phaseWithRetrospective.id,
            cycleId: this.cycle.id,
          }, 3)
          this.projectNoRetrospective = await factory.createMany('project', {
            phaseId: this.phaseNoRetrospective.id,
            cycleId: this.cycle.id,
          }, 3)
          this.usersWithRetrospective = await mockIdmUsersById(this.projectWithRetrospective.memberIds)
        })

        it('sends the cycle reflection announcement in direct message to phase project members', async function () {
          const memberHandles = this.usersWithRetrospective.map(u => u.handle)
          await processCycleReflectionStarted(this.cycle)
          expect(chatService.sendDirectMessage).to.have.been
            .calledWithMatch(memberHandles, 'Time to start your reflection process for cycle')
        })

        it('sends the cycle reflection announcement in phase channel', async function () {
          await processCycleReflectionStarted(this.cycle)
          expect(chatService.sendChannelMessage).to.have.been
            .calledWithMatch(this.phaseWithRetrospective.channelName, 'Time to start your reflection process for cycle')
        })

        it('does not send a cycle reflection announcement to ')
      })
    })
  })
})
