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
          this.phase = await factory.create('phase', {
            hasRetrospective: true,
            channelName: '#phase-channel-4'
          })
          this.project = await factory.createMany('project', {
            phaseId: this.phase.id,
            cycleId: this.cycle.id,
          }, 3)
          // console.log('Project Object!!!!!!', this.project)
          this.users = await mockIdmUsersById(this.project.memberIds)
        })

        it('sends the cycle reflection announcement in direct message to phase project members', async function () {
          const memberHandles = this.users.map(u => u.handle)
          // console.log('this.cycle in TEST!!!!', this.cycle)
          await processCycleReflectionStarted(this.cycle)
          expect(chatService.sendDirectMessage).to.have.been
            .calledWithMatch(memberHandles, 'Time to start your reflection process for cycle')
        })

        it('sends the cycle reflection announcement in phase channel', async function () {
          // console.log('channelName:', this.phase.channelName)
          await processCycleReflectionStarted(this.cycle)
          expect(chatService.sendChannelMessage).to.have.been
            .calledWithMatch(this.phase.channelName, 'Time to start your reflection process for cycle')
        })
      })
    })
  })
})
