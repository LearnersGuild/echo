/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'
import config from 'src/config'
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(async function () {
    this.chapter = await factory.create('chapter')
    this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
    this.pools = await factory.createMany('pool', {cycleId: this.cycle.id}, 2)

    this.poolVoters = this.pools.map(_ => [])
    this.poolMembers = []
    this.members = []
    /* eslint-disable babel/no-await-in-loop */
    for (const pool of this.pools) {
      const members = await factory.createMany('member', {chapterId: this.chapter.id}, 3)
      const poolMembers = members.map(member => ({memberId: member.id, poolId: pool.id}))
      await factory.createMany('poolMember', poolMembers, poolMembers.length)
      this.poolMembers.push(members)
      this.members.push(...members)
    }
    /* eslint-enable babel/no-await-in-loop */

    this.currentUser = await factory.build('user', {id: this.members[0].id})
  })

  const getCycleVotingResults = function (currentUser = this.currentUser) {
    return runGraphQLQuery(
      `query($cycleId: ID!) {
        getCycleVotingResults(
          cycleId: $cycleId
        )
        {
          cycle {
            id,
            state
          },
          pools {
            id,
            name,
            phase {
              id
              number
            },
            members { id },
            voterMemberIds,
            candidateGoals {
              goal {url},
              memberGoalRanks { memberId, goalRank }
            },
            votingIsStillOpen,
          }
        }
      }`,
      fields,
      {cycleId: this.cycle.id},
      {currentUser},
    )
  }

  describe('when there are votes', function () {
    const voteDataForPools = [
      {
        firstPlaceGoalNumber: 1,
        secondPlaceGoalNumber: 2,
        thirdPlaceGoalNumber: 3,
        goalNumberVotes: [
          [1, 2],
          [1, 2],
          [1, 3],
        ]
      },
      {
        firstPlaceGoalNumber: 101,
        secondPlaceGoalNumber: 102,
        thirdPlaceGoalNumber: 103,
        goalNumberVotes: [
          [101, 102],
          [101, 102],
          [101, 103],
        ]
      }
    ]

    beforeEach('create some votes', async function () {
      await Promise.map(this.pools, async (pool, i) => {
        await Promise.map(this.poolMembers[i], (member, j) => {
          const [goal1, goal2] = voteDataForPools[i].goalNumberVotes[j]
          return factory.create('vote', {
            memberId: member.id,
            poolId: pool.id,
            goals: [
              {url: `${config.server.goalLibrary.baseURL}/goals/${goal1}`},
              {url: `${config.server.goalLibrary.baseURL}/goals/${goal2}`},
            ],
          })
        })
        this.poolVoters[i] = this.poolMembers[i].slice()
      })
    })

    const assertValidCycleVotingResults = function (result) {
      const response = result.data.getCycleVotingResults
      expect(response.cycle.id).to.equal(this.cycle.id)
      expect(response.cycle.state).to.equal(this.cycle.state)
      this.pools.forEach((pool, i) => {
        const responsePool = response.pools.find(({name}) => name === pool.name)
        expect(responsePool.name).to.equal(pool.name)
        expect(responsePool.votingIsStillOpen).to.be.true
        expect(responsePool.members.map(_ => _.id).sort(), 'members').to.deep.equal(this.poolMembers[i].map(_ => _.id).sort())
        expect(responsePool.voterMemberIds.sort(), 'voterMemberIds').to.deep.equal(this.poolVoters[i].map(_ => _.id).sort())
        expect(responsePool.candidateGoals[0].goal.url).to.match(new RegExp(`/${voteDataForPools[i].firstPlaceGoalNumber}$`))
        expect(responsePool.candidateGoals[1].goal.url).to.match(new RegExp(`/${voteDataForPools[i].secondPlaceGoalNumber}$`))
        expect(responsePool.candidateGoals[2].goal.url).to.match(new RegExp(`/${voteDataForPools[i].thirdPlaceGoalNumber}$`))
        expect(responsePool.candidateGoals[0].memberGoalRanks.length).to.equal(3)
        expect(responsePool.candidateGoals[1].memberGoalRanks.length).to.equal(2)
        expect(responsePool.candidateGoals[2].memberGoalRanks.length).to.equal(1)
      })
    }

    it('returns results', function () {
      return getCycleVotingResults.call(this)
        .then(result => assertValidCycleVotingResults.call(this, result))
    })

    it('behaves correctly when user not logged in', function () {
      const getResults = () => getCycleVotingResults.call(this, null)
      return expect(getResults()).to.be.rejectedWith(/not authorized/)
    })

    it('behaves correctly when user is not a member', function () {
      return factory.build('user')
        .then(nonMemberUser => {
          const getResults = () => getCycleVotingResults.call(this, nonMemberUser)
          return expect(getResults()).to.be.rejectedWith(/Must be a member of a chapter/)
        })
    })

    describe('when there are votes that never validated', function () {
      beforeEach('create an invalid vote', async function () {
        const poolId = this.pools[0].id
        const member = await factory.create('member', {chapterId: this.chapter.id})
        this.poolMembers[0].push(member)
        this.members.push(member)
        await factory.create('poolMember', {memberId: member.id, poolId})
        await factory.create('invalid vote', {memberId: member.id, poolId})
      })

      it('ignores pending votes', function () {
        return getCycleVotingResults.call(this)
          .then(result => assertValidCycleVotingResults.call(this, result))
      })
    })

    describe('when there are votes from ineligible members', function () {
      beforeEach('create some ineligible votes', async function () {
        const chapter = await factory.create('chapter')
        const cycle = await factory.create('cycle', {chapterId: chapter.id})
        const pool = await factory.create('pool', {cycleId: cycle.id})
        const member = await factory.create('member', {chapterId: chapter.id})

        await factory.create('vote', {
          memberId: member.id,
          poolId: pool.id,
          goals: [
            {url: `${config.server.goalLibrary.baseURL}/goals/98`},
            {url: `${config.server.goalLibrary.baseURL}/goals/99`},
          ],
        })
      })

      it('ignores them', function () {
        return getCycleVotingResults.call(this)
          .then(result => assertValidCycleVotingResults.call(this, result))
      })
    })
  })

  describe('when no votes have been cast', function () {
    it('renders properly', function () {
      return getCycleVotingResults.call(this)
        .then(({data: {getCycleVotingResults: {candidateGoals}}}) => {
          return expect(candidateGoals).to.be.empty
        })
    })
  })
})
