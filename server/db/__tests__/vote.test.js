/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  saveVote,
  getVoteById,
  findVotesForPool,
  votesTable,
} from 'src/server/db/vote'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveVote()', function () {
    beforeEach(async function () {
      this.vote = await factory.create('vote')
    })

    it('updates existing record when id provided', function () {
      const updatedVote = Object.assign({}, this.vote, {newAttr: 'newVal'})
      return saveVote(updatedVote)
        .then(() => getVoteById(this.vote.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('saves a new record when new id provided', async function () {
      const newVote = await factory.build('vote')
      await saveVote(newVote)
      const count = await votesTable.count()
      expect(count).to.eq(2)
    })
  })

  describe('findVotesForPool()', function () {
    beforeEach(async function () {
      this.pool = await factory.create('pool')
      this.votes = await factory.createMany('vote', {poolId: this.pool.id}, 5)
      this.invalidVotes = await factory.createMany('invalid vote', {poolId: this.pool.id}, 5)
      await factory.createMany('vote', {}, 5)     // votes in another pool
    })

    it('returns valid votes for the given pool', async function () {
      const votes = await findVotesForPool(this.pool.id)
      const voteIds = votes.map(_ => _.id)
      expect(voteIds.length).to.eq(5)
      this.votes.forEach(vote => expect(voteIds).to.include(vote.id))
      this.invalidVotes.forEach(vote => expect(voteIds).to.not.include(vote.id))
    })

    it('filters out unwanted votes as requested', async function () {
      const {playerId} = this.votes[0]
      const vote = await findVotesForPool(this.pool.id, {playerId}).nth(0)
      expect(vote.playerId).to.eq(this.votes[0].playerId)
    })
  })
})
