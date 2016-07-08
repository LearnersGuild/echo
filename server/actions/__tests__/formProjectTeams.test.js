/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {assert} from 'chai'
import {truncateDBTables} from '../../../test/helpers'
import {findProjects} from '../../db/project'
import {findPlayers} from '../../db/player'
import factory from '../../../test/factories'

import {GOAL_SELECTION} from '../../../common/models/cycle'

import {formProjects, getTeamSizes, generateProjectName} from '../formProjectTeams'

const ADVANCED_PLAYER_ECC = 500
const DEFAULT_RECOMMENDED_TEAM_SIZE = 5

describe(testContext(__filename), function () {
  context('getTeamSizes()', function () {
    context('determines optimal team sizes for input', function () {
      const tests = [
        {
          message: 'perfect teams, 1 advanced player on team',
          input: {recommended: 4, regular: 15, advanced: 2},
          expected: [
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
          ]
        },

        {
          message: 'rec size + 1, 1 advanced player on team',
          input: {recommended: 5, regular: 10, advanced: 1},
          expected: [
            {regular: 5, advanced: 1},
            {regular: 5, advanced: 1},
          ]
        },

        {
          message: 'rec size + 1, 1 advanced player on team',
          input: {recommended: 4, regular: 16, advanced: 2},
          expected: [
            {regular: 4, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
          ]
        },

        {
          message: 'rec size + 1, multiple advanced players on team',
          input: {recommended: 4, regular: 6, advanced: 4},
          expected: [
            {regular: 3, advanced: 2},
            {regular: 3, advanced: 2},
          ]
        },

        {
          message: 'rec size - 1, 1 advanced player on team',
          input: {recommended: 4, regular: 14, advanced: 2},
          expected: [
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 3, advanced: 1},
            {regular: 2, advanced: 1},
          ]
        },

        {
          message: 'rec size - 1, 1 advanced player on team',
          input: {recommended: 4, regular: 4, advanced: 2},
          expected: [
            {regular: 2, advanced: 1},
            {regular: 2, advanced: 1},
          ]
        },

        {
          message: 'a wonky team',
          input: {recommended: 4, regular: 1, advanced: 1},
          expected: [{regular: 1, advanced: 1}]
        },
      ]

      tests.forEach(test => {
        const {recommended, regular, advanced} = test.input
        const result = getTeamSizes(recommended, regular, advanced)
        it(test.message, function () {
          assert.deepEqual(result, test.expected, `recommended (${recommended}), regular (${regular}), advanced (${advanced}`)
        })
      })
    })
  })

  context('generateProjectName()', function () {
    it('generates a valid project name', function () {
      return generateProjectName().then(function (projectName) {
        assert.match(projectName, /^\w+(-\w+)+(-\d)?$/)
      })
    })
  })

  describe('formProjects()', function () {
    context('fewer advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 1},
        votes: {popular: [1, 1, 1]}, // a most popular, a 2nd most popular, a 3rd most popular
      })
    })

    context('more advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 4},
        votes: {popular: [1]}, // 1 most popular
      })
    })

    context('equal number of advanced players as popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 3},
        votes: {popular: [3]}, // 3 equally popular
      })
    })

    context('lots of players who didn\'t vote', function () {
      _itFormsProjectsAsExpected({
        players: {total: 30, advanced: 3},
        votes: {popular: [3]}, // 3 equally popular
      })
    })

    context('all votes equally popular', function () {
      _itFormsProjectsAsExpected({
        players: {total: 24, advanced: 4},
        votes: {popular: [10]}, // 10 equally popular
      })
    })
  })
})

function _itFormsProjectsAsExpected(options) {
  before(truncateDBTables)

  before(function () {
    // describe test data
    const {players, votes} = options || {}
    console.log(`        players: ${players.total} total, ${players.advanced} advanced. votes: ${votes.popular} total, (${votes.popular}) popular.`)
  })

  before(async function () {
    const {cycle, players, votes} = await _generateTestData(options)
    await formProjects(cycle.id)
    this.data = {cycle, players, votes, projects: await findProjects().run()}
  })

  it('places all players on teams', async function () {
    const {cycle, projects} = this.data

    const allPlayers = await findPlayers().run()
    const projectPlayerIds = _extractPlayerIdsFromProjects(cycle.id, projects)

    assert.strictEqual(allPlayers.length, projectPlayerIds.length,
        'Number of players in chapter does not equal number of players assigned to projects')

    allPlayers.forEach(player => {
      const playerIdInProject = projectPlayerIds.find(playerId => playerId === player.id)
      assert.isOk(playerIdInProject, `Player ${player.id} not assigned to a project`)
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
      assert.isOk(advancedPlayerId, `Team for project ${project.id} does not include an advanced player`)
    })
  })

  it('creates projects for as many goals as were voted for and can be supported by the number of available advanced players', function () {
    const {players, projects} = this.data

    const projectGoals = _extractGoalsFromProjects(projects)

    const numPopularGoals = options.votes.popular.reduce((result, popularVoteCount) => (result + popularVoteCount), 0)
    const numExpectedGoals = Math.min(numPopularGoals, players.advanced.length)

    assert.strictEqual(projectGoals.length, numExpectedGoals,
        `Should have created projects for exactly ${numExpectedGoals} goals`)
  })

  it('creates projects for the most popular goals', function () {
    const {votes, projects} = this.data

    const projectGoals = _extractGoalsFromProjects(projects)

    const numPopularGoals = options.votes.popular.reduce((result, popularVoteCount) => (result + popularVoteCount), 0)
    const popularGoalUrls = _extractMostPopularGoalsFromVotes(votes, numPopularGoals).map(goal => goal.url)

    projectGoals.forEach(goal => {
      const isPopularGoal = popularGoalUrls.includes(goal.url)
      assert.strictEqual(isPopularGoal, true, `Goal ${goal.url} is not a popular goal`)
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

async function _generatePlayers(chapterId, options = {}) {
  const numTotal = options.total || 0
  const numAdvanced = options.advanced || 0
  return {
    regular: await factory.createMany('player', {chapterId}, numTotal - numAdvanced),
    advanced: await factory.createMany('player', {chapterId, ecc: ADVANCED_PLAYER_ECC}, numAdvanced)
  }
}

function _generateVotes(cycleId, players, options) {
  const voteData = _createGoalVotes(options)

  if (!(players.length >= voteData.length)) {
    throw new Error('Number of players must be greater than or equal to number of votes')
  }

  const votes = voteData.map((goalIds, i) => ({
    cycleId,
    playerId: players[i].id,
    goals: goalIds.map(goalId => ({
      url: `http://ex.co/${goalId}`,
      title: `Goal ${goalId}`,
      teamSize: DEFAULT_RECOMMENDED_TEAM_SIZE
    })),
  }))

  return factory.createMany('vote', votes, votes.length)
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

function _extractGoalsFromProjects(projects) {
  const goals = projects.reduce((result, project) => {
    result.set(project.goal.url, project.goal)
    return result
  }, new Map())

  return Array.from(goals.values())
}

function _extractMostPopularGoalsFromVotes(votes, count) {
  const goalCounts = votes.reduce((result, vote) => {
    vote.goals.forEach(goal => {
      if (!result.has(goal.url)) {
        result.set(goal.url, {goal, count: 0})
      }
      result.get(goal.url).count += 1
    })
    return result
  }, new Map())

  const sortedGoalCounts = Array.from(goalCounts.values()).sort((a, b) => {
    return b.count - a.count
  })

  return sortedGoalCounts.slice(0, count).map(goalCount => goalCount.goal)
}

/**
 * Vote arrangement generator examples.
 * TODO: this is kind of confusing. make it clearer?
 *
 * one first-, two second- and three third-most popular vote across first picks:
 *  config: {first: [1, 1, 1]}
 *  result: [
 *    [7, _], [7, _],                  // 3rd most popular (tie)
 *    [6, _], [6, _],                  // 3rd most popular (tie)
 *    [5, _], [5, _],                  // 3rd most popular (tie)
 *    [4, _], [4, _], [4, _],          // 2nd most popular (tie)
 *    [3, _], [3, _], [3, _],          // 2nd most popular (tie)
 *    [2, _], [2, _], [2, _],          // 2nd most popular (tie)
 *    [1, _], [1, _], [1, _], [1, _],  // 1st most popular
 * ]
 */
function _createGoalVotes(options) {
  const {total, popular} = options || {}
  const totalNumPopularGoals = Array.isArray(popular) ? popular.reduce((result, numPopularVotes) => {
    return result + numPopularVotes
  }, 0) : 0

  if (!total && !totalNumPopularGoals) {
    throw new Error('Must provide either total or popular vote count')
  }
  if (total && totalNumPopularGoals && total < totalNumPopularGoals) {
    throw new Error('Cannot specify a total number of goals lower than the sum of popular goals')
  }

  const votes = []
  let baseGoalId = 0

  // add popular votes (if specified)
  if (popular) {
    let numVotesPerGoal = 2

    // starting from the end, iterate through the collection
    // of specified vote counts for popular goals to be created
    for (let i = popular.length - 1; i >= 0; numVotesPerGoal++, i--) {
      const numGoalsToCreateVotesFor = popular[i]

      // iterate through each of the distinct popular goals that need votes created
      for (let j = 0; j < numGoalsToCreateVotesFor; j++) {
        baseGoalId = _nextGoalSeriesForVotes(baseGoalId)

        for (let k = 0; k < numVotesPerGoal; k++) {
          votes.push([baseGoalId, baseGoalId + j + k + 1])
        }
      }
    }
  }

  // fill with unique goal votes up to [total]
  while (total > votes.length) {
    baseGoalId = _nextGoalSeriesForVotes(baseGoalId)
    votes.push([baseGoalId, baseGoalId + 1])
  }

  return votes
}

function _nextGoalSeriesForVotes(currentSeries = 0) {
  return currentSeries + 100
}
