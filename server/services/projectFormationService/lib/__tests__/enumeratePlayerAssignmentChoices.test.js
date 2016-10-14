/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  getNonAdvancedPlayerCount,
  getAdvancedPlayerCount,
  getNonAdvancedPlayerIds,
} from '../pool'
import {choose} from '../util'
import {teamFormationPlanToString} from '../teamFormationPlan'

import enumeratePlayerAssignmentChoices, {
  heuristicPlayerAssignment,
  enumerateExtraSeatAssignmentChoices,
} from '../enumeratePlayerAssignmentChoices'

describe(testContext(__filename), function () {
  const pool = {
    votes: [
      {playerId: 'A0', votes: ['g1', 'g2']},
      {playerId: 'A1', votes: ['g1', 'g2']},
      {playerId: 'A2', votes: ['g1', 'g2']},
      {playerId: 'p0', votes: ['g1', 'g2']},
      {playerId: 'p1', votes: ['g1', 'g2']},
      {playerId: 'p2', votes: ['g1', 'g2']},
    ],
    goals: [
      {goalDescriptor: 'g1', teamSize: 2},
      {goalDescriptor: 'g2', teamSize: 2},
      {goalDescriptor: 'g3', teamSize: 2},
    ],
    advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}, {id: 'A2', maxTeams: 3}],
  }
  const teamFormationPlan = {
    seatCount: 6,
    teams: [
      {goalDescriptor: 'g1', teamSize: 2},
      {goalDescriptor: 'g2', teamSize: 2},
      {goalDescriptor: 'g3', teamSize: 2},
    ]
  }

  it('returns the expected number of plans', function () {
    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

    const nonAdvancedPlayerCount = getNonAdvancedPlayerCount(pool)
    const advancedPlayerCount = getAdvancedPlayerCount(pool)

    expect(result).to.have.length(
      choose(advancedPlayerCount, 1) *
      choose(advancedPlayerCount - 1, 1) *
      choose(nonAdvancedPlayerCount, 1) *
      choose(nonAdvancedPlayerCount - 1, 1)
    )
  })

  it('returns the expected plans', function () {
    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

    expect(result.map(teamFormationPlanToString).sort()).to.deep.eq([
      '(g1:2)[A0,p0], (g2:2)[A1,p1], (g3:2)[A2,p2]',
      '(g1:2)[A0,p0], (g2:2)[A1,p2], (g3:2)[A2,p1]',
      '(g1:2)[A0,p0], (g2:2)[A2,p1], (g3:2)[A1,p2]',
      '(g1:2)[A0,p0], (g2:2)[A2,p2], (g3:2)[A1,p1]',
      '(g1:2)[A0,p1], (g2:2)[A1,p0], (g3:2)[A2,p2]',
      '(g1:2)[A0,p1], (g2:2)[A1,p2], (g3:2)[A2,p0]',
      '(g1:2)[A0,p1], (g2:2)[A2,p0], (g3:2)[A1,p2]',
      '(g1:2)[A0,p1], (g2:2)[A2,p2], (g3:2)[A1,p0]',
      '(g1:2)[A0,p2], (g2:2)[A1,p0], (g3:2)[A2,p1]',
      '(g1:2)[A0,p2], (g2:2)[A1,p1], (g3:2)[A2,p0]',
      '(g1:2)[A0,p2], (g2:2)[A2,p0], (g3:2)[A1,p1]',
      '(g1:2)[A0,p2], (g2:2)[A2,p1], (g3:2)[A1,p0]',
      '(g1:2)[A1,p0], (g2:2)[A0,p1], (g3:2)[A2,p2]',
      '(g1:2)[A1,p0], (g2:2)[A0,p2], (g3:2)[A2,p1]',
      '(g1:2)[A1,p0], (g2:2)[A2,p1], (g3:2)[A0,p2]',
      '(g1:2)[A1,p0], (g2:2)[A2,p2], (g3:2)[A0,p1]',
      '(g1:2)[A1,p1], (g2:2)[A0,p0], (g3:2)[A2,p2]',
      '(g1:2)[A1,p1], (g2:2)[A0,p2], (g3:2)[A2,p0]',
      '(g1:2)[A1,p1], (g2:2)[A2,p0], (g3:2)[A0,p2]',
      '(g1:2)[A1,p1], (g2:2)[A2,p2], (g3:2)[A0,p0]',
      '(g1:2)[A1,p2], (g2:2)[A0,p0], (g3:2)[A2,p1]',
      '(g1:2)[A1,p2], (g2:2)[A0,p1], (g3:2)[A2,p0]',
      '(g1:2)[A1,p2], (g2:2)[A2,p0], (g3:2)[A0,p1]',
      '(g1:2)[A1,p2], (g2:2)[A2,p1], (g3:2)[A0,p0]',
      '(g1:2)[A2,p0], (g2:2)[A0,p1], (g3:2)[A1,p2]',
      '(g1:2)[A2,p0], (g2:2)[A0,p2], (g3:2)[A1,p1]',
      '(g1:2)[A2,p0], (g2:2)[A1,p1], (g3:2)[A0,p2]',
      '(g1:2)[A2,p0], (g2:2)[A1,p2], (g3:2)[A0,p1]',
      '(g1:2)[A2,p1], (g2:2)[A0,p0], (g3:2)[A1,p2]',
      '(g1:2)[A2,p1], (g2:2)[A0,p2], (g3:2)[A1,p0]',
      '(g1:2)[A2,p1], (g2:2)[A1,p0], (g3:2)[A0,p2]',
      '(g1:2)[A2,p1], (g2:2)[A1,p2], (g3:2)[A0,p0]',
      '(g1:2)[A2,p2], (g2:2)[A0,p0], (g3:2)[A1,p1]',
      '(g1:2)[A2,p2], (g2:2)[A0,p1], (g3:2)[A1,p0]',
      '(g1:2)[A2,p2], (g2:2)[A1,p0], (g3:2)[A0,p1]',
      '(g1:2)[A2,p2], (g2:2)[A1,p1], (g3:2)[A0,p0]',
    ].sort())
  })

  it('returns plans with the correct number of players in each team', function () {
    const teamFormationPlan = {
      seatCount: 6,
      teams: [
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 4},
      ]
    }

    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
    result.forEach(newPlan => {
      expect(newPlan.teams[0]).to.have('playerIds').with.length(2)
      expect(newPlan.teams[1]).to.have('playerIds').with.length(4)
    })
  })

  it('returns plans with the same goal selections as in root plan', function () {
    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

    result.forEach(newPlan =>
      expect(
        newPlan.teams.map(({goalDescriptor, teamSize}) => ({goalDescriptor, teamSize}))
      ).to.deep.eq(
        teamFormationPlan.teams
      )
    )
  })

  it('accepts a pruning function', function () {
    const shouldPrune = teamFormationPlan => {
      // Prune any branch where g1 has players with even ids
      const g1Team = teamFormationPlan.teams.find(({goalDescriptor}) => goalDescriptor === 'g1')
      const prune = g1Team && g1Team.playerIds.some(id => id.match(/[02468]/))
      return prune
    }
    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)]
    const oddAdvancedPlayerCount = 2
    const oddNonAdvancedPlayerCount = 2

    expect(result).to.have.length(
      choose(oddAdvancedPlayerCount, 1) *
      choose(oddNonAdvancedPlayerCount, 1)
    )
  })

  describe('when there are goals not requiring an advanced player', function () {
    const pool = {
      votes: [
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},

        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},

        {playerId: 'A1', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 2, noAdvancedPlayer: true},
        {goalDescriptor: 'g2', teamSize: 2},
        {goalDescriptor: 'g3', teamSize: 2},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }
    const teamFormationPlan = {
      seatCount: 6,
      teams: [
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
        {goalDescriptor: 'g3', teamSize: 2},
      ]
    }

    let result
    beforeEach(function () {
      result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
    })

    it('returns the expected number of plans', function () {
      const nonAdvancedPlayerCount = getNonAdvancedPlayerCount(pool)
      const advancedPlayerCount = getAdvancedPlayerCount(pool)

      expect(result).to.have.length(
        choose(advancedPlayerCount, 1) * // pick an advanced player for the first team team that needs one
        choose(advancedPlayerCount - 1, 1) * // pick an advanced player for the other team hat needs one
        choose(nonAdvancedPlayerCount, 2) * // pick players for the first team
        choose(nonAdvancedPlayerCount - 2, 1)  // pick a remaining player for the second team (leaving only one left for the third)
      )
    })

    it('returns the expected plans', function () {
      const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

      expect(result.map(teamFormationPlanToString).sort()).to.deep.eq([
        '(g1:2)[p0,p1], (g2:2)[A0,p2], (g3:2)[A1,p3]',
        '(g1:2)[p0,p1], (g2:2)[A0,p3], (g3:2)[A1,p2]',
        '(g1:2)[p0,p1], (g2:2)[A1,p2], (g3:2)[A0,p3]',
        '(g1:2)[p0,p1], (g2:2)[A1,p3], (g3:2)[A0,p2]',
        '(g1:2)[p0,p2], (g2:2)[A0,p1], (g3:2)[A1,p3]',
        '(g1:2)[p0,p2], (g2:2)[A0,p3], (g3:2)[A1,p1]',
        '(g1:2)[p0,p2], (g2:2)[A1,p1], (g3:2)[A0,p3]',
        '(g1:2)[p0,p2], (g2:2)[A1,p3], (g3:2)[A0,p1]',
        '(g1:2)[p0,p3], (g2:2)[A0,p2], (g3:2)[A1,p1]',
        '(g1:2)[p0,p3], (g2:2)[A0,p1], (g3:2)[A1,p2]',
        '(g1:2)[p0,p3], (g2:2)[A1,p2], (g3:2)[A0,p1]',
        '(g1:2)[p0,p3], (g2:2)[A1,p1], (g3:2)[A0,p2]',
        '(g1:2)[p1,p2], (g2:2)[A0,p0], (g3:2)[A1,p3]',
        '(g1:2)[p1,p2], (g2:2)[A0,p3], (g3:2)[A1,p0]',
        '(g1:2)[p1,p2], (g2:2)[A1,p0], (g3:2)[A0,p3]',
        '(g1:2)[p1,p2], (g2:2)[A1,p3], (g3:2)[A0,p0]',
        '(g1:2)[p1,p3], (g2:2)[A0,p2], (g3:2)[A1,p0]',
        '(g1:2)[p1,p3], (g2:2)[A0,p0], (g3:2)[A1,p2]',
        '(g1:2)[p1,p3], (g2:2)[A1,p2], (g3:2)[A0,p0]',
        '(g1:2)[p1,p3], (g2:2)[A1,p0], (g3:2)[A0,p2]',
        '(g1:2)[p2,p3], (g2:2)[A0,p0], (g3:2)[A1,p1]',
        '(g1:2)[p2,p3], (g2:2)[A0,p1], (g3:2)[A1,p0]',
        '(g1:2)[p2,p3], (g2:2)[A1,p0], (g3:2)[A0,p1]',
        '(g1:2)[p2,p3], (g2:2)[A1,p1], (g3:2)[A0,p0]',
      ].sort())
    })
  })

  describe('when there are extra seats', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
        {goalDescriptor: 'g3', teamSize: 2},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }
    const teamFormationPlan = {
      seatCount: 6,
      teams: [
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
        {goalDescriptor: 'g3', teamSize: 2},
      ]
    }

    let result
    beforeEach(function () {
      result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
    })

    it('returns the expected number of plans', function () {
      const nonAdvancedPlayerCount = getNonAdvancedPlayerCount(pool)
      const advancedPlayerCount = getAdvancedPlayerCount(pool)

      expect(result).to.have.length(
        choose(advancedPlayerCount, 1) * teamFormationPlan.teams.length * // pick an advanced player for each team
        choose(nonAdvancedPlayerCount, 1) * // pick a player for the first team
        choose(nonAdvancedPlayerCount - 1, 1)  // pick a remaining player for the second team (leaving only one left for the third)
      )
    })

    it('contains plans where each advanced player fills the extra seat', function () {
      for (const {id} of pool.advancedPlayers) {
        expect(
          result.some(({teams}) =>
            teams.filter(({playerIds}) => playerIds.includes(id)).length === 2
          ),
          `Advanced Player ${id} gets on two teams in some plans`
        ).to.be.true
      }
    })
  })

  describe('enumerateExtraSeatAssignmentChoices()', function () {
    const pretty = choices => Array.from(choices).map(choice => choice.join(',')).sort()

    it('works', function () {
      const advancedPlayerInfo = [{id: 'A0', maxTeams: 1}, {id: 'A1', maxTeams: 2}, {id: 'A2', maxTeams: 3}, {id: 'A3', maxTeams: 4}]
      const result = enumerateExtraSeatAssignmentChoices(advancedPlayerInfo, 3)
      expect(pretty(result)).to.deep.eq(pretty([
          ['A1', 'A2', 'A2'],
          ['A1', 'A2', 'A3'],
          ['A1', 'A3', 'A3'],
          ['A2', 'A2', 'A3'],
          ['A2', 'A3', 'A3'],
          ['A3', 'A3', 'A3'],
      ]))
    })
  })

  describe('heuristicPlayerAssignment()', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g3']},
        {playerId: 'A1', votes: ['g3', 'g2']},
        {playerId: 'p0', votes: ['g3', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g3']},
        {playerId: 'p2', votes: ['g3', 'g2']},
        {playerId: 'p4', votes: ['g4', 'g3']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
        {goalDescriptor: 'g3', teamSize: 3},
        {goalDescriptor: 'g4', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }
    const teamFormationPlan = {
      seatCount: 6,
      teams: [
        {goalDescriptor: 'g1', teamSize: 3, playerIds: ['A0']},
        {goalDescriptor: 'g2', teamSize: 3, playerIds: ['A1']},
      ]
    }

    it('returns a valid teamFormationPlan', function () {
      const result = heuristicPlayerAssignment(pool, teamFormationPlan, getNonAdvancedPlayerIds(pool))

      result.teams.forEach(team => {
        expect(team.playerIds).to.have.length(team.teamSize)
        expect(team.playerIds.every(id => id.match(/[Ap]\d/)), 'player ids are all valid').to.be.ok
      })
    })
  })
})
