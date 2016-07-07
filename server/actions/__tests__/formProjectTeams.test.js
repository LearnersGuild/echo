/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {assert} from 'chai'
import {truncateDBTables} from '../../../test/helpers'
import {findProjects} from '../../db/project'
import factory from '../../../test/factories'

import {GOAL_SELECTION} from '../../../common/models/cycle'

import {formProjects, getTeamSizes, generateProjectName} from '../formProjectTeams'

const POPULAR_ISSUES = {ONE: 101, TWO: 102, THREE: 103, FOUR: 104}
const UNPOPULAR_ISSUES = {ONE: 201, TWO: 202, THREE: 203, FOUR: 204, FIVE: 205, SIX: 206}
const ADVANCED_PLAYER_ECC = 500
const DEFAULT_RECOMMENDED_TEAM_SIZE = 5

describe(testContext(__filename), function () {
  context('getTeamSizes(recTeamSize, numPlayers)', function () {
    it('determines optimal team sizes based on recommended size and player count', function () {
      assert.deepEqual(getTeamSizes(4, 16), [4, 4, 4, 4])
      assert.deepEqual(getTeamSizes(4, 19), [4, 4, 4, 4, 3])
      assert.deepEqual(getTeamSizes(4, 18), [5, 5, 4, 4])
      assert.deepEqual(getTeamSizes(4, 17), [5, 4, 4, 4])
      assert.deepEqual(getTeamSizes(4, 5), [5])
      assert.deepEqual(getTeamSizes(4, 2), [2])
      assert.deepEqual(getTeamSizes(4, 6), [3, 3])
    })
  })

  context('generateProjectName()', function () {
    it('generates a valid project name', function () {
      return generateProjectName().then(function (projectName) {
        assert.match(projectName, /^\w+(-\w+)+(-\d)?$/)
      })
    })
  })

  describe('formProjects', function () {
    context('fewer advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 2},
      })
    })

    context('more advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 4},
      })
    })

    context('all votes equally popular', function () {
      const FOUR_VOTES_WITH_FOUR_POPULAR = [
        [POPULAR_ISSUES.ONE, UNPOPULAR_ISSUES.ONE],
        [POPULAR_ISSUES.TWO, UNPOPULAR_ISSUES.TWO],
        [POPULAR_ISSUES.THREE, UNPOPULAR_ISSUES.THREE],
        [POPULAR_ISSUES.FOUR, UNPOPULAR_ISSUES.FOUR],
      ]

      _itFormsProjectsAsExpected({
        players: {total: 19, advanced: 4},
        votes: FOUR_VOTES_WITH_FOUR_POPULAR,
      })
    })
  })
})

function _itFormsProjectsAsExpected(options) {
  before(truncateDBTables)

  before(async function () {
    const {cycle, players, votes} = await _generateTestData(options)

    // describe test data
    console.log(`        ${players.regular.length} regular players, ${players.advanced.length} advanced players, ${votes.length} votes`)

    await formProjects(cycle.id)

    this.data = {cycle, players, votes, projects: await findProjects().run()}
  })

  it('places all players on teams when not everyone voted', function () {
    const {cycle, players, projects} = this.data

    const projectPlayerIds = _extractPlayerIdsFromProjects(cycle.id, projects)
    const allPlayers = players.regular.concat(players.advanced)

    assert.strictEqual(projectPlayerIds.length, allPlayers.length,
        'number of players in chapter does not equal number of players assigned to projects')

    allPlayers.forEach(player => {
      const playerIdInProject = projectPlayerIds.find(playerId => playerId === player.id)
      assert.isOk(playerIdInProject, `player ${player.id} not assigned to a project`)
    })
  })

  it('creates project teams that all contain at least one advanced player', function () {
    const {cycle, players, projects} = this.data

    const advancedPlayers = players.advanced.reduce((result, player) => {
      result[player.id] = player
      return result
    }, {})

    projects.forEach(project => {
      const playerIds = _extractPlayerIdsFromProjects(cycle.id, [project])
      const advancedPlayerId = playerIds.find(playerId => advancedPlayers[playerId])
      assert.isOk(advancedPlayerId, `team for project ${project.id} does not include an advanced player`)
    })
  })

  it('creates projects for as many goals as were voted for and can be supported by the number of available advanced players', function () {
    const {players, votes, projects} = this.data

    const projectGoals = _extractGoalsFromProjects(projects)

    const votedForGoals = votes.reduce((result, vote) => {
      vote.goals.forEach(goal => result.set(goal.url, true))
      return result
    }, new Map())

    const maxNumExpectedProjectGoals = Math.min(votedForGoals.size, players.advanced.length)

    assert.closeTo(projectGoals.length, maxNumExpectedProjectGoals, 1)
  })

  it('creates projects for the most popular goals', function () {
    const {projects} = this.data

    const projectGoals = _extractGoalsFromProjects(projects)
    const popularGoalIds = Object.values(POPULAR_ISSUES)

    projectGoals.forEach(goal => {
      const isPopularGoal = popularGoalIds.includes(goal.id)
      assert.strictEqual(isPopularGoal, true, `goal ${goal.id} is not a popular goal`)
    })
  })
}

async function _generateTestData(options = {}) {
  // generate test cycle
  const cycle = await factory.create('cycle', {state: GOAL_SELECTION})

  // generate test players
  const players = await _generatePlayers(cycle.chapterId, options.players)

  // generate test votes
  const votes = await _generateVotes(cycle.id, players.regular, options.votes)

  // return test data
  return {cycle, players, votes}
}

async function _generatePlayers(chapterId, options) {
  const numPlayers = options.players ? options.players.total : 10
  const numPlayersAdvanced = options.players ? options.players.advanced : 2

  return {
    regular: await factory.createMany('player', {chapterId}, numPlayers - numPlayersAdvanced),
    advanced: await factory.createMany('player', {chapterId, ecc: ADVANCED_PLAYER_ECC}, numPlayersAdvanced)
  }
}

function _generateVotes(cycleId, players, votes) {
  votes = votes || [
    // 6 votes (2 popular)
    [POPULAR_ISSUES.ONE, POPULAR_ISSUES.TWO],
    [POPULAR_ISSUES.ONE, UNPOPULAR_ISSUES.ONE],
    [POPULAR_ISSUES.ONE, UNPOPULAR_ISSUES.TWO],
    [POPULAR_ISSUES.TWO, UNPOPULAR_ISSUES.THREE],
    [POPULAR_ISSUES.TWO, UNPOPULAR_ISSUES.FOUR],
    [UNPOPULAR_ISSUES.FIVE, UNPOPULAR_ISSUES.SIX],
  ]

  if (!(players.length >= votes.length)) {
    throw new Error('Number of players must be greater than or equal to number of votes')
  }

  votes = votes.map((goalIssueIds, i) => ({
    cycleId,
    playerId: players[i].id,
    goals: goalIssueIds.map(goalIssueId => ({
      id: goalIssueId,
      url: `http://ex.co/${goalIssueId}`,
      title: `Goal ${goalIssueId}`,
      teamSize: DEFAULT_RECOMMENDED_TEAM_SIZE
    })),
  }))

  return factory.createMany('vote', votes, votes.length)
}

function _extractGoalsFromProjects(projects) {
  const goals = projects.reduce((result, project) => {
    result.set(project.goal.url, project.goal)
    return result
  }, new Map())

  return Array.from(goals.values())
}

function _extractPlayerIdsFromProjects(cycleId, projects) {
  const playerIds = projects.reduce((result, project) => {
    project.cycleHistory
      .find(projectCycle => projectCycle.cycleId === cycleId)
      .playerIds.forEach(playerId => result.set(playerId, playerId))
    return result
  }, new Map())

  return Array.from(playerIds.values())
}
