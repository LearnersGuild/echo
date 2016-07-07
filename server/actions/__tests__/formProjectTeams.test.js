/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'
import {findProjects} from '../../db/project'

import {GOAL_SELECTION} from '../../../common/models/cycle'

import {formProjects, getTeamSizes, generateProjectName} from '../formProjectTeams'

const POPULAR_ISSUES = {ONE: 101, TWO: 102}
const UNPOPULAR_ISSUES = {ONE: 201, TWO: 202, THREE: 203, FOUR: 204, FIVE: 205, SIX: 206}
const ADVANCED_PLAYER_ECC = 500
const DEFAULT_RECOMMENDED_TEAM_SIZE = 5

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('formProjects', function () {
    describe('10 players (2 advanced), 6 votes (2 popular)', function () {
      beforeEach(async function () {
        this.data = await _setup({
          players: {total: 10, advanced: 2},
        })
      })

      it('places all players on teams when not everyone voted', async function () {
        const {cycle, players} = this.data

        expect(players.regular.length).to.be.equal(8)
        expect(players.advanced.length).to.be.equal(2)

        await formProjects(cycle.id)

        const projects = await findProjects().run()
        const projectPlayerIds = _extractPlayerIdsFromProjects(cycle.id, projects)

        const allPlayers = players.regular.concat(players.advanced)
        expect(projectPlayerIds.length).to.equal(allPlayers.length)

        allPlayers.forEach(player => {
          const playerIdInProject = projectPlayerIds.find(playerId => playerId === player.id)
          expect(playerIdInProject).to.exist
        })
      })

      it('creates project teams that all contain at least one advanced player', async function () {
        const {cycle, players} = this.data

        await formProjects(cycle.id)

        const projects = await findProjects().run()
        const advancedPlayers = players.advanced.reduce((result, player) => {
          result[player.id] = player
          return result
        }, {})

        projects.forEach(project => {
          const playerIds = _extractPlayerIdsFromProjects(cycle.id, [project])
          const advancedPlayerId = playerIds.find(playerId => advancedPlayers[playerId])
          expect(advancedPlayerId).to.exist
        })
      })

      it('creates projects for as many goals as were voted for and can be supported by the number of available advanced players', async function () {
        const {cycle, votes, players} = this.data

        expect(votes.length).to.be.equal(6)

        await formProjects(cycle.id)

        const projects = await findProjects().run()
        const projectGoals = _extractGoalsFromProjects(projects)

        const votedForGoals = votes.reduce((result, vote) => {
          vote.goals.forEach(goal => result.set(goal.url, true))
          return result
        }, new Map())

        const maxNumExpectedProjectGoals = Math.min(votedForGoals.size, players.advanced.length)

        expect(projectGoals.length).to.be.within(1, maxNumExpectedProjectGoals)
      })

      it('creates projects for the most popular goals', async function () {
        const {cycle} = this.data

        await formProjects(cycle.id)

        const projects = await findProjects().run()
        const projectGoals = _extractGoalsFromProjects(projects)

        projectGoals.forEach(goal => {
          expect(POPULAR_ISSUES[goal.id] !== null)
        })
      })
    })
  })

  describe('getTeamSizes(recTeamSize, numPlayers)', function () {
    it('determines optimal team sizes based on recommended size and player count', function () {
      expect(getTeamSizes(4, 16)).to.deep.equal([4, 4, 4, 4])
      expect(getTeamSizes(4, 19)).to.deep.equal([4, 4, 4, 4, 3])
      expect(getTeamSizes(4, 18)).to.deep.equal([5, 5, 4, 4])
      expect(getTeamSizes(4, 17)).to.deep.equal([5, 4, 4, 4])
      expect(getTeamSizes(4, 5)).to.deep.equal([5])
      expect(getTeamSizes(4, 2)).to.deep.equal([2])
      expect(getTeamSizes(4, 6)).to.deep.equal([3, 3])
    })
  })

  describe('generateProjectName()', function () {
    it('generates a valid project name', function () {
      return generateProjectName().then(function (projectName) {
        expect(projectName).to.match(/^\w+(-\w+)+(-\d)?$/)
      })
    })
  })
})

async function _setup(options = {}) {
  // generate test cycle
  const cycle = await factory.create('cycle', {state: GOAL_SELECTION})

  // generate test players
  const numPlayers = options.players ? options.players.total : 10
  const numPlayersAdvanced = options.players ? options.players.advanced : 2
  const players = {
    regular: await _generatePlayers({chapterId: cycle.chapterId}, numPlayers - numPlayersAdvanced),
    advanced: await _generatePlayers({chapterId: cycle.chapterId, ecc: ADVANCED_PLAYER_ECC}, numPlayersAdvanced)
  }

  // generate test votes
  const votes = await _generateVotes(cycle.id, players.regular, options.votes)

  // return all test data
  return {cycle, players, votes}
}

function _generatePlayers(data, numPlayers) {
  return factory.createMany('player', data, numPlayers)
}

function _generateVotes(cycleId, players) {
  let votes = [
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
