/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'
import {addPlayerIdsToPool} from 'src/server/db/pool'

import {getCommand} from 'src/server/cliCommand/util'

import {concatResults} from './helpers'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('vote', function () {
    beforeEach(async function () {
      const {commandSpec, commandImpl} = getCommand('vote')
      this.commandSpec = commandSpec
      this.commandImpl = commandImpl
      this.chapter = await factory.create('chapter')
      this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, state: 'GOAL_SELECTION'})
      this.pool = await factory.create('pool', {cycleId: this.cycle.id})
      this.player = await factory.create('player', {chapterId: this.chapter.id})
      await addPlayerIdsToPool(this.pool.id, [this.player.id])

      this.voteGoals = [
        '1',
        'some-slug',
      ]
    })

    const voteForGoals = async function () {
      const args = this.commandSpec.parse(this.voteGoals)
      const result = await this.commandImpl.invoke(args, {user: this.player})
      const fullResult = concatResults(result)
      return fullResult
    }

    const assertVoteRecorded = function () {
      return r.table('votes').limit(1).run().then(votes => {
        const vote = votes[0]

        expect(vote.poolId).to.equal(this.pool.id)
        expect(vote.playerId).to.equal(this.player.id)
        expect(vote.notYetValidatedGoalDescriptors).to.deep.equal([parseInt(this.voteGoals[0], 10), this.voteGoals[1]])
      })
    }

    const assertValidResponse = function (result) {
      expect(result).to.match(/cycle voting results/i)
      expect(result).to.contain(this.voteGoals.join(', '))
    }

    it('records the vote', function () {
      return voteForGoals.call(this)
        .then(result => assertValidResponse.call(this, result))
        .then(() => assertVoteRecorded.call(this))
    })

    it('rejects an attempt to vot for the same goal twice', function () {
      this.voteGoals = ['1', '1']
      return expect(voteForGoals.call(this)).to.be.rejectedWith(/You cannot vote for the same goal twice/)
    })

    describe('when player has already voted', function () {
      beforeEach(async function () {
        this.initialVote = await factory.create('vote', {
          playerId: this.player.id,
          poolId: this.pool.id,
        })
      })

      it('updates the vote', function () {
        return voteForGoals.call(this)
          .then(result => assertValidResponse.call(this, result))
          .then(() => assertVoteRecorded.call(this))
          .then(() => r.table('votes').limit(1).run())
          .then(votes => votes[0])
          .then(vote => {
            expect(vote.id).to.equal(this.initialVote.id)
            expect(
              vote.updatedAt.getTime()
            ).to.not.equal(
              this.initialVote.updatedAt.getTime()
            )
          })
      })
    })
  })
})
