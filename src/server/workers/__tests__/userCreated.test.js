/* eslint-env mocha */
/* global expect, assert, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import nock from 'nock'

import config from 'src/config'
import factory from 'src/test/factories'
import {useFixture, resetDB} from 'src/test/helpers'
import {Member} from 'src/server/services/dataService'

import {processUserCreated} from '../userCreated'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('processUserCreated', function () {
    describe('when there is a new user w/ a member role', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter', {
          inviteCodes: ['test']
        })
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 3,
        })
        this.user = await factory.build('user', {roles: ['member']})
        this.nockGitHub = (user, replyCallback = () => ({})) => {
          useFixture.nockClean()
          nock(config.server.github.baseURL)
            .persist()
            .put(`/teams/${this.chapter.githubTeamId}/memberships/${user.handle}`)
            .reply(200, replyCallback)
        }
      })

      describe('creates a new member', function () {
        it('initializes the member', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
        })

        it('adds the member to the github team', async function () {
          const replyCallback = arg => {
            expect(arg).to.eql(`/teams/${this.chapter.githubTeamId}/memberships/${this.user.handle}`)
            return JSON.stringify({})
          }
          this.nockGitHub(this.user, replyCallback)
          await processUserCreated(this.user)
        })

        it('inserts the new member into the database', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
          const user = await Member.get(this.user.id)
          expect(user).to.not.be.null
        })

        it('does not replace the given member if their account already exists', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
          const oldMember = await Member.get(this.user.id)

          assert.doesNotThrow(async function () {
            await processUserCreated(this.user)
          }, Error)

          await processUserCreated({...this.user, name: 'new name'})
          const updatedUser = await Member.get(this.user.id)

          expect(updatedUser.createdAt).to.eql(oldMember.createdAt)
        })
      })
    })
  })
})
