/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {assert} from 'chai'
import {truncateDBTables} from '../../../test/helpers'
import {findProjects} from '../../db/project'
import factory from '../../../test/factories'

import {GOAL_SELECTION} from '../../../common/models/cycle'

import formProjects from '../formProjects'

const TEST_ADVANCED_PLAYER_ECC = 5000
const DEFAULT_RECOMMENDED_TEAM_SIZE = 5

describe(testContext(__filename), function () {
  describe('formProjects()', function () {
    context('fewer advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 1},
        votes: {min: 9, popular: [1, 1, 1]}, // a most popular, a 2nd most popular, a 3rd most popular
      })
    })

    context('more advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 4},
        votes: {min: 6, popular: [1]}, // 1 most popular
      })
    })

    context('equal number of advanced players as popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 3},
        votes: {min: 7, popular: [3]}, // 3 equally popular
      })
    })

    context('lots of players who didn\'t vote', function () {
      _itFormsProjectsAsExpected({
        players: {total: 30, advanced: 3},
        votes: {min: 27, popular: [3]}, // 3 equally popular
      })
    })

    context('all votes equally popular', function () {
      _itFormsProjectsAsExpected({
        players: {total: 24, advanced: 4},
        votes: {min: 20, popular: [10]}, // 10 equally popular
      })
    })
  })
})

function _itFormsProjectsAsExpected(options) {
  before(truncateDBTables)

  before(function () {
    // describe test data
    const {players, votes} = options || {}
    console.log(`        players: ${players.total} total, ${players.advanced} advanced. votes: ${votes.min} min, (${votes.popular}) popular.`)
  })

  before(async function () {
    const {cycle, players, votes} = await _generateTestData(options)
    await formProjects(cycle.id)
    this.data = {cycle, players, votes, projects: await findProjects().run()}
  })

  it('places all players who voted on teams, and ONLY players who voted', function () {
    const {cycle, projects, players} = this.data

    const votingPlayers = players.advanced.concat(players.regular)
    const projectPlayerIds = _extractPlayerIdsFromProjects(cycle.id, projects)

    assert.strictEqual(votingPlayers.length, projectPlayerIds.length,
        'Number of players who voted does not equal number of players assigned to projects')

    votingPlayers.forEach(player => {
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
    const numExpectedGoals = Math.min(projectGoals.length, players.advanced.length)

    assert.strictEqual(projectGoals.length, numExpectedGoals,
        `Should have created projects for exactly ${numExpectedGoals} goals`)
  })

  it('creates projects for the most popular goals', function () {
    const {votes, projects, players} = this.data

    const advancedPlayersById = _mapById(players.advanced)
    const regularPlayerVotes = votes.filter(vote => !advancedPlayersById.has(vote.playerId))

    const projectGoals = _extractGoalsFromProjects(projects)

    const numPopularGoals = options.votes.popular.reduce((result, popularVoteCount) => (result + popularVoteCount), 0)
    const popularGoalUrls = _extractMostPopularGoalsFromVotes(regularPlayerVotes, numPopularGoals).map(goal => goal.url)

    if (popularGoalUrls.length >= projectGoals.length) {
      // more popular goals than projects that could be formed;
      // every project goal should be be popular goal
      projectGoals.forEach(goal => {
        const isPopularGoal = popularGoalUrls.includes(goal.url)
        assert.strictEqual(isPopularGoal, true, `Goal ${goal.url} is not a popular goal`)
      })
    } else {
      // enough teams that all popular goals should have been included;
      // all popular goals should be included in project goals
      popularGoalUrls.forEach(popularGoalUrl => {
        const matchedPopularGoal = projectGoals.find(goal => goal.url === popularGoalUrl)
        assert.isOk(matchedPopularGoal, `Popular goal ${popularGoalUrl} is not included`)
      })
    }
  })
}

async function _generateTestData(options = {}) {
  // generate test cycle
  const cycle = await factory.create('cycle', {state: GOAL_SELECTION})

  // generate test players
  const players = await _generatePlayers(cycle.chapterId, options.players)

  // generate test votes
  // advanced player votes will be discarded, but they must be created
  // in order for the advanced players to be assigned to teams.
  const [regularVotes, advancedVotes] = await Promise.all([
    _generateVotes(cycle.id, players.regular, options.votes),
    _generateVotes(cycle.id, players.advanced, options.votes),
  ])
  const votes = regularVotes.concat(advancedVotes)

  // return test data
  return {cycle, players, votes}
}

async function _generatePlayers(chapterId, options = {}) {
  const numTotal = options.total || 0
  const numAdvanced = options.advanced || 0
  return {
    regular: await factory.createMany('player', {chapterId}, numTotal - numAdvanced),
    advanced: await factory.createMany('player', {chapterId, stats: {ecc: TEST_ADVANCED_PLAYER_ECC}}, numAdvanced)
  }
}

function _generateVotes(cycleId, players, options) {
  let voteData = _createGoalVotes(options)

  if (!(players.length >= voteData.length) && !options.requireAllVotes) {
    voteData = voteData.slice(0, players.length)
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
  const {min, popular} = options || {}
  const totalNumPopularGoals = Array.isArray(popular) ? popular.reduce((result, numPopularVotes) => {
    return result + numPopularVotes
  }, 0) : 0

  if (!min && !totalNumPopularGoals) {
    throw new Error('Must provide either min or popular vote count')
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

  // fill as necessary with unique goal votes up to <min>
  while (min > votes.length) {
    baseGoalId = _nextGoalSeriesForVotes(baseGoalId)
    votes.push([baseGoalId, baseGoalId + 1])
  }

  return votes
}

function _nextGoalSeriesForVotes(currentSeries = 0) {
  return currentSeries + 100
}

function _mapById(objects) {
  return objects.reduce((result, obj) => {
    result.set(obj.id, obj)
    return result
  }, new Map())
}
