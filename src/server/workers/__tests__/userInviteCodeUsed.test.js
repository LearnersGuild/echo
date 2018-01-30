/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('processUserInviteCodeUsed', function () {
    const {Member} = require('src/server/services/dataService')

    const {processUserInviteCodeUsed} = require('../userInviteCodeUsed')

    describe('when there is a new member', function () {
      beforeEach(async function () {
        const inviteCode = 'test'
        this.chapter = await factory.create('chapter', {inviteCodes: [inviteCode]})
        this.user = await factory.build('user', {inviteCode})
      })

      it('creates a member in the chapter for the invite code', async function () {
        await processUserInviteCodeUsed(this.user)
        const member = await Member.get(this.user.id)
        expect(member.chapterId).to.eq(this.chapter.id)
      })
    })
  })
})
