/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'
import {findProjects} from '../../db/project'
import {findPlayers} from '../../db/player'

import {GOAL_SELECTION} from '../../../common/models/cycle'

import {formProjectTeams, getTeamSizes, generateProjectName} from '../formProjectTeams'

const MOST_POPULAR_GOAL_ISSUE_NUM_1 = 1
const MOST_POPULAR_GOAL_ISSUE_NUM_2 = 3
const UNPOPULAR_GOAL_1 = 2
const UNPOPULAR_GOAL_2 = 4
const UNPOPULAR_GOAL_3 = 6
const UNPOPULAR_GOAL_4 = 7
const ADVANCED_PLAYER_ECC = 500
const RECOMMENDED_TEAM_SIZE = 5

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('formProjectTeams', function () {
    beforeEach(async function () {
      const cycles = await _createCycles([{state: GOAL_SELECTION}])
      const cycle = cycles[0]

      const players = await _createPlayers([
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId},
        {chapterId: cycle.chapterId, ecc: ADVANCED_PLAYER_ECC},
        {chapterId: cycle.chapterId, ecc: ADVANCED_PLAYER_ECC},
      ])

      const votes = await _createVotes(cycle, players, [
        [MOST_POPULAR_GOAL_ISSUE_NUM_1, UNPOPULAR_GOAL_1],
        [MOST_POPULAR_GOAL_ISSUE_NUM_1, UNPOPULAR_GOAL_1],
        [MOST_POPULAR_GOAL_ISSUE_NUM_1, MOST_POPULAR_GOAL_ISSUE_NUM_2],
        [MOST_POPULAR_GOAL_ISSUE_NUM_2, UNPOPULAR_GOAL_2],
        [MOST_POPULAR_GOAL_ISSUE_NUM_2, UNPOPULAR_GOAL_2],
        [UNPOPULAR_GOAL_3, UNPOPULAR_GOAL_4],
      ])

      this.cycle = cycle
      this.players = players
      this.votes = votes

      this.popularGoalIssueNums = [MOST_POPULAR_GOAL_ISSUE_NUM_1, MOST_POPULAR_GOAL_ISSUE_NUM_2]
      this.advancedPlayers = players.filter(player => player.ecc === ADVANCED_PLAYER_ECC)
    })

    it('creates projects for as many goals as were voted for and can be supported by the number of available advanced players', async function () {
      await formProjectTeams(this.cycle.id)

      const votedForGoals = this.votes.reduce((result, vote) => {
        vote.goals.forEach(goal => result.set(goal.url, true))
        return result
      }, new Map())

      const numVotedForGoals = votedForGoals.size
      const numAdvancedPlayers = this.players.reduce((result, player) => {
        return player.ecc === ADVANCED_PLAYER_ECC ? (result + 1) : result
      }, 0)

      const maxNumExpectedProjectGoals = Math.min(numVotedForGoals, numAdvancedPlayers)

      const projects = await findProjects().run()
      const projectGoals = projects.reduce((result, project) => {
        result.set(project.goal.url, true)
        return result
      }, new Map())

      expect(projectGoals.size).to.be.within(1, maxNumExpectedProjectGoals)
    })

    it('creates projects for the most popular goals', async function () {
      await formProjectTeams(this.cycle.id)
      const projects = await findProjects().run()

      this.popularGoalIssueNums.forEach(i => {
        const popularGoalProject = projects.find(p => p.goal.url.endsWith(i))
        expect(popularGoalProject).to.exist
      })
    })

    it('creates project teams that all contain at least one advanced player', async function () {
      await formProjectTeams(this.cycle.id)
      const projects = await findProjects().run()

      projects.forEach(project => {
        const {playerIds} = project.cycleHistory.find(projectCycle => {
          return projectCycle.cycleId === this.cycle.id
        })

        const advancedPlayerId = playerIds.find(playerId => {
          return this.advancedPlayers.find(advancedPlayer => advancedPlayer.id === playerId)
        })

        expect(advancedPlayerId).to.exist
      })
    })

    it('places all players in teams when not everyone voted', async function () {
      await _createPlayers([{chapterId: this.cycle.chapterId}])
      const allPlayers = await findPlayers().run()

      await formProjectTeams(this.cycle.id)
      const projects = await findProjects().run()

      const projectPlayerIds = projects.reduce((result, project) => {
        const projectCycle = project.cycleHistory.find(projectCycle => projectCycle.cycleId === this.cycle.id)
        projectCycle.playerIds.forEach(playerId => result.set(playerId, true))
        return result
      }, new Map())

      allPlayers.forEach(player => {
        expect(projectPlayerIds.get(player.id)).to.equal(true)
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

function _createCycles(cycleData) {
  return factory.createMany('cycle', cycleData)
}

function _createPlayers(playerData) {
  return factory.createMany('player', playerData)
}

function _createVotes(cycle, players, voteData) {
  return factory.createMany('vote',
    voteData.map((goalIssueIds, i) => ({
      cycleId: cycle.id,
      playerId: players[i].id,
      goals: goalIssueIds.map(goalIssueId => ({
        url: `http://ex.co/${goalIssueId}`,
        title: `Goal ${goalIssueId}`,
        teamSize: RECOMMENDED_TEAM_SIZE
      })),
    })),
    voteData.length,
  )
}
