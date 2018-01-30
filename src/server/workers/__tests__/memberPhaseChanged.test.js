/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, useFixture, mockIdmUsersById} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processMemberPhaseChangeCompleted()', function () {
    const chatService = require('src/server/services/chatService')

    const {processMemberPhaseChangeCompleted} = require('../memberPhaseChanged')

    describe('when a member changes phase', function () {
      beforeEach('set up member phase data', async function () {
        const [chapter, phase] = await Promise.all([
          factory.create('chapter'),
          factory.create('phase', {number: 3}),
        ])
        const [member] = await Promise.all([
          factory.create('member', {chapterId: chapter.id, phaseId: phase.id}),
          factory.create('phase', {number: phase.number - 1}),
        ])
        useFixture.nockClean()
        this.user = (await mockIdmUsersById([member.id]))[0]
        this.phase = phase
        this.member = member
      })

      it('invites the member to the new phase\'s channel', async function () {
        await processMemberPhaseChangeCompleted(this.member)
        expect(chatService.inviteToChannel).to.have.been
          .calledWith(this.phase.channelName, [this.user.handle])
      })

      it('sends a welcome DM to the member', async function () {
        await processMemberPhaseChangeCompleted(this.member)
        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(this.user.handle, `Welcome to the ${this.phase.name} phase!`)
      })
    })
  })
})
