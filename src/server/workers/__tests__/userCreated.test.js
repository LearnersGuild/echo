/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'
import {gitHubService} from 'src/test/stubs'
import {Member, Chapter} from 'src/server/services/dataService'
import {processUserCreated} from 'src/server/workers/userCreated'
import {addUserToTeam} from 'src/server/services/gitHubService'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    gitHubService.enable()
  })

  afterEach(function () {
    gitHubService.disable()
  })

  describe('processUserCreated', function () {
    describe('when there is a new user', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter', {
          inviteCodes: ['test']
        })
        this.user = await factory.build('user')
        this.phase = await factory.create('phase', {
          number: 1
        })
      })

      describe('for a new member', function () {
        it('initializes the member', async function () {
          await processUserCreated(this.user)
          const member = await Member.get(this.user.id)
          const chapter = (await Chapter.getAll(this.user.inviteCode, {index: 'inviteCodes'}))[0]

          expect(member).to.exist
          expect(member.chapterId).to.eq(this.chapter.id, 'member should have chapter ID for invite code')
          expect(addUserToTeam.callCount).to.eql(1)
          expect(addUserToTeam.calledWithExactly(this.user.handle, chapter.githubTeamId)).to.eql(true)
        })

        describe('if the new user has role of \'learner\'', function () {
          it('should assign a default phase', async function () {
            await processUserCreated(this.user)
            const user = await Member.get(this.user.id)

            expect(user.phaseId).to.eq(this.phase.id)
          })
        })

        describe('if the new user does not have role of \'learner\'', function () {
          it('should not assign a default phase', async function () {
            this.user = await factory.build('user', {roles: ['admin']})
            await processUserCreated(this.user)
            const user = await Member.get(this.user.id)

            expect(user.phaseId).to.not.exist
          })
        })
      })

      describe('for an existing member', function () {
        it('fails hard if member already exists', async function () {
          await processUserCreated(this.user)

          const getRejection = async () => {
            await processUserCreated(this.user)
          }

          return expect(getRejection()).to.be.rejectedWith(/already exists/i)
        })
      })
    })
  })
})
