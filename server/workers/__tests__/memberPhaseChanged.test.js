/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

describe.only(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processPhaseChangeCompleted()', function () {
    const chatService = require('src/server/services/chatService')

    const {processPhaseChangeCompleted} = require('../memberPhaseChanged')

    describe('when a member changes phase', function () {
      beforeEach(async function () {
        this.user = await factory.build('user')
        this.phase = await factory.create('phase', {hasVoting: false})
      })

      it('sends a message to user that they have changed phases', async function () {
        console.log('=====this.user, this.phase======', this.user, this.phase)
        await processPhaseChangeCompleted(this.phase.number)
        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.user.handle,
            `${this.user.handle} is now in phase ${this.phase.number}`
          )
      })
    })
  })
})
