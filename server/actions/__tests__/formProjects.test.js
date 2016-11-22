/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {assert} from 'chai'
import {truncateDBTables} from 'src/test/helpers'
import factory from 'src/test/factories'
import {findProjects} from 'src/server/db/project'
import {repeat} from 'src/server/util'
import {GOAL_SELECTION} from 'src/common/models/cycle'

import {formProjects, formProjectsIfNoneExist} from 'src/server/actions/formProjects'

const RECOMMENDED_TEAM_SIZE = 4

describe(testContext(__filename), function () {
  describe('formProjects()', function () {
    context('all goals equally popular', function () {
      _itFormsProjectsAsExpected({
        players: 6,
        votes: {distribution: [3, 3]},
      })
    })

    context('one goal gets all votes', function () {
      _itFormsProjectsAsExpected({
        players: 6,
        votes: {distribution: [6]},
      })
    })

    context('every goal gets one vote', function () {
      _itFormsProjectsAsExpected({
        players: 6,
        votes: {distribution: [...repeat(6, 1)]},
      })
    })
  })

  describe('formProjectsIfNoneExist()', function () {
    before(truncateDBTables)

    it('creates projects only once for a given cycle', async function () {
      const {cycle} = await _generateTestData({
        players: 6,
        votes: {distribution: [6]},
      })
      await formProjectsIfNoneExist(cycle.id)
      const findFilter = {cycleId: cycle.id}
      const projectCount = await findProjects(findFilter).count()
      assert(projectCount > 0, 'projectCount should be > 0')
      await formProjectsIfNoneExist(cycle.id)
      const newProjectCount = await findProjects(findFilter).count()
      assert(projectCount === newProjectCount, 'projectCount should not change')
    })
  })
})

function _itFormsProjectsAsExpected(options) {
  before(truncateDBTables)

  before(async function () {
    const {cycle, players, votes} = await _generateTestData(options)
    await formProjects(cycle.id)
    this.data = {cycle, players, votes, projects: await findProjects()}
  })

  it('places all players who voted on teams, and ONLY players who voted', function () {
    const {projects, players} = this.data

    const projectPlayerIds = _extractPlayerIdsFromProjects(projects)

    assert.strictEqual(players.length, projectPlayerIds.length,
        'Number of players who voted does not equal number of players assigned to projects')

    players.forEach(player => {
      const playerIdInProject = projectPlayerIds.find(playerId => playerId === player.id)
      assert.isOk(playerIdInProject, `Player ${player.id} not assigned to a project`)
    })
  })
}

async function _generateTestData(options = {}) {
  const cycle = await factory.create('cycle', {state: GOAL_SELECTION})
  const pool = await factory.create('pool', {cycleId: cycle.id})
  const players = await factory.createMany('player', {chapterId: cycle.chapterId}, options.players)
  const votes = await _generateVotes(pool.id, players, options.votes)

  return {cycle, players, votes}
}

function _generateVotes(poolId, players, options) {
  const voteData = _createGoalVotes(options)

  const votes = voteData.map((goalIds, i) => ({
    poolId,
    playerId: players[i].id,
    goals: goalIds.map(goalId => ({
      url: `http://ex.co/${goalId}`,
      title: `Goal ${goalId}`,
      teamSize: RECOMMENDED_TEAM_SIZE
    })),
  }))

  return factory.createMany('vote', votes, votes.length)
}

function _extractPlayerIdsFromProjects(projects) {
  const allPlayerIds = projects.reduce((result, project) => {
    project.playerIds.forEach(playerId => result.set(playerId, playerId))
    return result
  }, new Map())

  return Array.from(allPlayerIds.values())
}

function _createGoalVotes({distribution}) {
  return distribution.reduce((votes, count, i) => {
    const firstChoice = i + 100
    const secondChoice = firstChoice + 1
    const vote = [firstChoice, secondChoice]
    return votes.concat(repeat(count, vote))
  }, [])
}
