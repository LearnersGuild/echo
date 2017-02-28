/* eslint-env mocha */
/* global expect, assert, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {useFixture, withDBCleanup} from 'src/test/helpers'
import {getUserById} from 'src/server/db/user'
import {processUserCreated} from 'src/server/workers/userCreated'
import {getPlayersInPool} from 'src/server/db/pool'
import {COMPLETE} from 'src/common/models/cycle'
import updateCycleState from 'src/server/actions/updateCycleState'
import {MAX_POOL_SIZE} from 'src/server/actions/createPoolsForCycle'

import nock from 'nock'
import config from 'src/config'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processUserCreated', function () {
    describe('when there is a new user', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter', {
          inviteCodes: ['test']
        })
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 3,
        })
        this.user = await factory.build('user')
        this.pool = await factory.create('pool', {
          level: 1,
          cycleId: this.cycle.id
        })
        this.levelZeroPool = await factory.create('pool', {
          level: 0,
          cycleId: this.cycle.id
        })
        this.levelTwoPool = await factory.create('pool', {
          level: 2,
          cycleId: this.cycle.id
        })
        this.nockGitHub = (user, replyCallback = () => ({})) => {
          useFixture.nockClean()
          nock(config.server.github.baseURL)
            .persist()
            .put(`/teams/${this.chapter.githubTeamId}/memberships/${user.handle}`)
            .reply(200, replyCallback)
        }
      })

      describe('creates a new player', function () {
        it('initializes the player at level 1', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
          const user = await getUserById(this.user.id)

          expect(user.stats.level).to.eql(1)
        })

        it('adds the player to the github team', async function () {
          const replyCallback = arg => {
            expect(arg).to.eql(`/teams/${this.chapter.githubTeamId}/memberships/${this.user.handle}`)
            return JSON.stringify({})
          }
          this.nockGitHub(this.user, replyCallback)
          await processUserCreated(this.user)
        })

        it('inserts the new player into the database', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
          const user = await getUserById(this.user.id)

          expect(user).to.not.be.null
        })

        it('inserts the new player into a level 1 pool', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
          const pool = await getPlayersInPool(this.pool.id)

          expect(pool.map(player => player.id)).to.include(this.user.id)
        })

        it('replaces the given player if their ID already exists', async function () {
          this.nockGitHub(this.user)
          await processUserCreated(this.user)
          const oldUser = await getUserById(this.user.id)

          assert.doesNotThrow(async function () {
            await processUserCreated(this.user)
          }, Error)

          await processUserCreated({...this.user, name: 'new name'})
          const updatedUser = await getUserById(this.user.id)

          expect(updatedUser.createdAt).to.not.eql(oldUser.createdAt)
        })

        it('creates a large pool if necessary', async function () {
          const otherUsers = []
          for (let i = 0; i < MAX_POOL_SIZE; i++) {
            otherUsers[i] = await factory.build('user')
            this.nockGitHub(otherUsers[i])
            await processUserCreated(otherUsers[i])
          }
          const pool = await getPlayersInPool(this.pool.id)

          const newUser = await factory.build('user')
          this.nockGitHub(newUser)
          await processUserCreated(newUser)

          const newPool = await getPlayersInPool(this.pool.id)
          expect(newPool.length).to.not.eql(pool.length)
          expect(newPool.map(user => user.id)).to.include(newUser.id)
        })

        describe('when there are multiple pools for the player\'s level', function () {
          it('adds the player to the pool with fewest players', async function () {
            this.nockGitHub(this.user)
            await processUserCreated(this.user)
            const poolWithPlayers = await getPlayersInPool(this.pool.id)

            const otherPool = await factory.create('pool', {
              level: 1,
              cycleId: this.cycle.id
            })
            const newPlayer = await factory.build('user')
            this.nockGitHub(newPlayer)
            await processUserCreated(newPlayer)
            const otherPoolWithPlayers = await getPlayersInPool(otherPool.id)

            expect(poolWithPlayers.map(player => player.id)).to.include(this.user.id)
            expect(otherPoolWithPlayers.map(player => player.id)).to.include(newPlayer.id)
          })

          it('does not add players to a pool if the cycle state is not GOAL_SELECTION', async function () {
            this.nockGitHub(this.user)
            await updateCycleState(this.cycle, COMPLETE)
            await processUserCreated(this.user)
            const pool = await getPlayersInPool(this.pool.id)

            expect(pool.length).to.eql(0)
            expect(pool.map(player => player.id)).to.not.include(this.user.id)
          })
        })
      })
    })
  })
})
