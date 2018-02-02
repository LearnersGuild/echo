/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import config from 'src/config'
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {Phase} from 'src/server/services/dataService'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processCycleInitialized()', function () {
    const chatService = require('src/server/services/chatService')

    const {processCycleInitialized} = require('../cycleInitialized')

    describe('when a new cycle is created', function () {
      beforeEach(async function () {
        this.cycle = await factory.create('cycle', {cycleNumber: 2})
        useFixture.nockClean()
        useFixture.nockIDMGetUsersById([], {times: 10})
      })

      it('sends a message to the phase chat channel', async function () {
        await processCycleInitialized(this.cycle)

        const phases = await Phase.run()

        expect(chatService.sendChannelMessage.callCount).to.eq(phases.length)

        phases.forEach(phase => {
          expect(chatService.sendChannelMessage).to.have.been
            .calledWithMatch(phase.channelName, `Cycle ${this.cycle.cycleNumber}`)

          expect(chatService.sendChannelMessage).to.have.been
            .calledWithMatch(phase.channelName, `To create a new project, visit: ${config.app.projectURL}.`)
        })
      })
    })
  })
})
