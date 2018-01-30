/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {GOAL_SELECTION} from 'src/common/models/cycle'

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
          factory.create('phase', {number: 3, hasVoting: true}),
        ])
        const [cycle, member] = await Promise.all([
          factory.create('cycle', {chapterId: chapter.id, state: GOAL_SELECTION}),
          factory.create('member', {chapterId: chapter.id, phaseId: phase.id}),
          factory.create('phase', {number: phase.number - 1, hasVoting: false}),
        ])
        useFixture.nockClean()
        this.user = (await mockIdmUsersById([member.id]))[0]
        this.pool = factory.create('pool', {cycleId: cycle.id, phaseId: phase.id})
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
