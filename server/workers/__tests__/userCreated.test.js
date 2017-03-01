/* eslint-env mocha */
/* global expect, assert, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'
import {getUserById} from 'src/server/db/user'
import {processUserCreated} from 'src/server/workers/userCreated'
import {getPlayersInPool, getPlayersCountForPools} from 'src/server/db/pool'
import {COMPLETE, GOAL_SELECTION} from 'src/common/models/cycle'
import updateCycleState from 'src/server/actions/updateCycleState'

describe(testContext(__filename), function() {
  withDBCleanup()
  
  describe('processUserCreated', function() {
    describe('when there is a new user', function() {
      beforeEach(async function() {
        this.chapter = await factory.create('chapter', {
          inviteCodes: ['test']
        })
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 3,
        })
        this.user = await factory.build('user')
        this.pool = await factory.create('pool', {
          level: 0,
          cycleId: this.cycle.id
        })
        this.levelTwoPool = await factory.create('pool', {
          level: 2,
          cycleId: this.cycle.id
        })
      })

      describe('creates a new player', function () {
        it('inserts the new player into the database', async function() {
          await processUserCreated(this.user)
          const user = await getUserById(this.user.id)

          expect(user).to.not.be.null
        })

        // TODO: look at sinon to try and mock-out the external API calls

        it('inserts the new player into a level 0 pool', async function() {
          await processUserCreated(this.user)
          const pool = await getPlayersInPool(this.pool.id)

          expect(pool.map(player => player.id)).to.include(this.user.id)
        })

        it('replaces the given player if their ID already exists', async function() {
          await processUserCreated(this.user)
          const oldUser = await getUserById(this.user.id)

          assert.doesNotThrow(async function() {
            await processUserCreated(this.user)
          }, Error)


          //TODO: Figure out how to compare the player before and after

          // await processUserCreated(this.user)

          // const updatedUser = await getUserById(this.user.id)

          // console.log(Date.parse(oldUser.createdAt))
          // console.log(Date.parse(updatedUser.createdAt))

          // expect(updatedUser.createdAt).to.not.eql(oldUser.createdAt)
        })

        it('creates a large pool if necessary', async function() {
          this.otherUsers = []
          for(let i = 0; i < 15; i++) {
            this.otherUsers[i] = await factory.build('user')
            await processUserCreated(this.otherUsers[i])
          }
          const pool = await getPlayersInPool(this.pool.id)

          this.newUser = await factory.build('user')
          await processUserCreated(this.newUser)

          const newPool = await getPlayersInPool(this.pool.id)
          expect(newPool.length).to.not.eql(pool.length)
          expect(newPool.map(user => user.id)).to.include(this.newUser.id)
        })

        describe('when there are multiple pools for the player\'s level', function () {
          it('adds the player to the pool with fewest players', async function() {
            await processUserCreated(this.user)
            const poolWithPlayers = await getPlayersInPool(this.pool.id)

            this.otherPool = await factory.create('pool', {
              level: 0,
              cycleId: this.cycle.id
            })
            this.newPlayer = await factory.build('user')
            await processUserCreated(this.newPlayer)
            const otherPoolWithPlayers = await getPlayersInPool(this.otherPool.id)

            expect(poolWithPlayers.map(player => player.id)).to.include(this.user.id)
            expect(otherPoolWithPlayers.map(player => player.id)).to.include(this.newPlayer.id)
          })

          it('does not add players to a pool if the cycle state is not GOAL_SELECTION', async function() {
            await updateCycleState(this.cycle, COMPLETE)
            await processUserCreated(this.user)
            const pool = await getPlayersInPool(this.pool.id)

            expect(pool.length).to.eql(0)
            expect(pool.map(player => player.id)).to.not.include(this.newPlayer.id)
          })
        })
      })
    })
  })
})
