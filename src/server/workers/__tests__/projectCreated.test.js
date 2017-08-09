/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import nock from 'nock'
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, mockIdmUsersById} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)
  beforeEach(function () {
    stubs.chatService.enable()
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
    stubs.jobService.disable()
  })

  describe('processProjectCreated()', async function () {
    const chatService = require('src/server/services/chatService')
    const {processProjectCreated} = require('../projectCreated')

    describe('for voting phases', function () {
      beforeEach(async function () {
        nock.cleanAll()
        this.phase = await factory.create('phase', {hasVoting: true})
        this.project = await factory.create('project', {phaseId: this.phase.id})
        this.users = await mockIdmUsersById(this.project.memberIds, null, {strict: true, times: 10})
        this.memberHandles = this.users.map(p => p.handle)
      })

      afterEach(function () {
        nock.cleanAll()
      })

      it('send a welcome message to the project members', async function () {
        await processProjectCreated(this.project)
        expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(this.memberHandles, 'Welcome to the')
      })
    })
  })
})
