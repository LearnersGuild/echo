/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {GOAL_SELECTION, PRACTICE} from 'src/common/models/cycle'
import {withDBCleanup, useFixture} from 'src/test/helpers'

import {getCommand} from 'src/server/cliCommand/util'

import {concatResults} from './helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.ensureNoGlobalWindow()

  beforeEach('create moderator', async function () {
    const {commandSpec, commandImpl} = getCommand('cycle')
    this.commandSpec = commandSpec
    this.commandImpl = commandImpl
    this.moderatorUser = await factory.build('user', {roles: ['moderator']})
    this.moderator = await factory.create('moderator', {id: this.moderatorUser.id})
  })

  describe('cycle init', function () {
    it('returns an "Initializing" message on success', async function () {
      const args = this.commandSpec.parse(['init'])
      const result = await this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(concatResults(result)).to.match(/Initializing/i)
    })

    it('reports the default project hours when requested', async function () {
      const args = this.commandSpec.parse(['init', '--hours=32'])
      const result = await this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(concatResults(result)).to.match(/32/)
    })
  })

  describe('cycle launch', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: GOAL_SELECTION})
    })

    it('returns a "Launch" message on success', async function () {
      const args = this.commandSpec.parse(['launch'])
      const result = await this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(concatResults(result)).to.match(/Launch/)
    })
  })

  describe('cycle reflect', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: PRACTICE})
    })

    it('returns a "Reflection" message on success', async function () {
      const args = this.commandSpec.parse(['reflect'])
      const result = await this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(concatResults(result)).to.match(/Reflection/)
    })
  })
})
