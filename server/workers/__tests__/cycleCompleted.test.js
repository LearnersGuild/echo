/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processCycleCompleted()', function () {
    const chatService = require('src/server/services/chatService')

    const {processCycleCompleted} = require('../cycleCompleted')

    describe('when a cycle has completed', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter')
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 3,
        })
      })

      it('sends a message to the chapter chatroom', async function () {
        await processCycleCompleted(this.cycle)
        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.chapter.channelName, `Cycle ${this.cycle.cycleNumber} is complete`)
      })
    })
  })
})
