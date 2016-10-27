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
  enumerateAdvancedSeatAssignmentChoices,
} from '../enumeratePlayerAssignmentChoices'

import {buildTestPool, buildTestTeamFormationPlan} from '../../__tests__/helpers'

describe(testContext(__filename), function () {
  const pool = buildTestPool({
    playerCount: 3,
    advancedPlayerCount: 3,
    goalCount: 3,
    teamSizes: [2, 2, 2],
    voteDistributionPercentages: [1],
  })

  const teamFormationPlan = buildTestTeamFormationPlan([
    {goal: 'g0', teamSize: 2},
    {goal: 'g1', teamSize: 2},
    {goal: 'g2', teamSize: 2},
  ], pool)

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
      '(g0:2)[A0,p0], (g1:2)[A1,p1], (g2:2)[A2,p2]',
      '(g0:2)[A0,p0], (g1:2)[A1,p2], (g2:2)[A2,p1]',
      '(g0:2)[A0,p0], (g1:2)[A2,p1], (g2:2)[A1,p2]',
      '(g0:2)[A0,p0], (g1:2)[A2,p2], (g2:2)[A1,p1]',
      '(g0:2)[A0,p1], (g1:2)[A1,p0], (g2:2)[A2,p2]',
      '(g0:2)[A0,p1], (g1:2)[A1,p2], (g2:2)[A2,p0]',
      '(g0:2)[A0,p1], (g1:2)[A2,p0], (g2:2)[A1,p2]',
      '(g0:2)[A0,p1], (g1:2)[A2,p2], (g2:2)[A1,p0]',
      '(g0:2)[A0,p2], (g1:2)[A1,p0], (g2:2)[A2,p1]',
      '(g0:2)[A0,p2], (g1:2)[A1,p1], (g2:2)[A2,p0]',
      '(g0:2)[A0,p2], (g1:2)[A2,p0], (g2:2)[A1,p1]',
      '(g0:2)[A0,p2], (g1:2)[A2,p1], (g2:2)[A1,p0]',
      '(g0:2)[A1,p0], (g1:2)[A0,p1], (g2:2)[A2,p2]',
      '(g0:2)[A1,p0], (g1:2)[A0,p2], (g2:2)[A2,p1]',
      '(g0:2)[A1,p0], (g1:2)[A2,p1], (g2:2)[A0,p2]',
      '(g0:2)[A1,p0], (g1:2)[A2,p2], (g2:2)[A0,p1]',
      '(g0:2)[A1,p1], (g1:2)[A0,p0], (g2:2)[A2,p2]',
      '(g0:2)[A1,p1], (g1:2)[A0,p2], (g2:2)[A2,p0]',
      '(g0:2)[A1,p1], (g1:2)[A2,p0], (g2:2)[A0,p2]',
      '(g0:2)[A1,p1], (g1:2)[A2,p2], (g2:2)[A0,p0]',
      '(g0:2)[A1,p2], (g1:2)[A0,p0], (g2:2)[A2,p1]',
      '(g0:2)[A1,p2], (g1:2)[A0,p1], (g2:2)[A2,p0]',
      '(g0:2)[A1,p2], (g1:2)[A2,p0], (g2:2)[A0,p1]',
      '(g0:2)[A1,p2], (g1:2)[A2,p1], (g2:2)[A0,p0]',
      '(g0:2)[A2,p0], (g1:2)[A0,p1], (g2:2)[A1,p2]',
      '(g0:2)[A2,p0], (g1:2)[A0,p2], (g2:2)[A1,p1]',
      '(g0:2)[A2,p0], (g1:2)[A1,p1], (g2:2)[A0,p2]',
      '(g0:2)[A2,p0], (g1:2)[A1,p2], (g2:2)[A0,p1]',
      '(g0:2)[A2,p1], (g1:2)[A0,p0], (g2:2)[A1,p2]',
      '(g0:2)[A2,p1], (g1:2)[A0,p2], (g2:2)[A1,p0]',
      '(g0:2)[A2,p1], (g1:2)[A1,p0], (g2:2)[A0,p2]',
      '(g0:2)[A2,p1], (g1:2)[A1,p2], (g2:2)[A0,p0]',
      '(g0:2)[A2,p2], (g1:2)[A0,p0], (g2:2)[A1,p1]',
      '(g0:2)[A2,p2], (g1:2)[A0,p1], (g2:2)[A1,p0]',
      '(g0:2)[A2,p2], (g1:2)[A1,p0], (g2:2)[A0,p1]',
      '(g0:2)[A2,p2], (g1:2)[A1,p1], (g2:2)[A0,p0]',
    ].sort())
  })

  it('returns plans with the correct number of players in each team', function () {
    const teamFormationPlan = buildTestTeamFormationPlan([
      {goal: 'g0', teamSize: 2},
      {goal: 'g1', teamSize: 4},
    ], pool)

    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
    result.forEach(newPlan => {
      expect(newPlan.teams[0]).to.have.property('playerIds').with.length(2)
      expect(newPlan.teams[1]).to.have.property('playerIds').with.length(4)
    })
  })

  it('returns plans with the same goal selections as in root plan', function () {
    const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
    const pluckDescriptorAndSize = teams => teams
      .map(({goalDescriptor, teamSize}) => ({goalDescriptor, teamSize}))

    result.forEach(newPlan =>
      expect(
        pluckDescriptorAndSize(newPlan.teams)
      ).to.deep.eq(
        pluckDescriptorAndSize(teamFormationPlan.teams)
      )
    )
  })

  it('accepts a pruning function', function () {
    const shouldPrune = teamFormationPlan => {
      // Prune any branch where g0 has players with even ids
      const g0Team = teamFormationPlan.teams.find(({goalDescriptor}) => goalDescriptor === 'g0')
      const prune = g0Team && g0Team.playerIds.some(id => id.match(/[02468]/))
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
        {playerId: 'p1', votes: ['g0', 'g1']},
        {playerId: 'p0', votes: ['g0', 'g1']},

        {playerId: 'A0', votes: ['g0', 'g1']},
        {playerId: 'p2', votes: ['g0', 'g1']},

        {playerId: 'A1', votes: ['g0', 'g1']},
        {playerId: 'p3', votes: ['g0', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g0', teamSize: 2, noAdvancedPlayer: true},
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }

    describe('when there are enough teams requiring an advanced player for all advanced players', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 2},
        {goal: 'g1', teamSize: 2},
        {goal: 'g2', teamSize: 2},
      ], pool)

      it('returns the expected number of plans', function () {
        const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
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
          '(g0:2)[p0,p1], (g1:2)[A0,p2], (g2:2)[A1,p3]',
          '(g0:2)[p0,p1], (g1:2)[A0,p3], (g2:2)[A1,p2]',
          '(g0:2)[p0,p1], (g1:2)[A1,p2], (g2:2)[A0,p3]',
          '(g0:2)[p0,p1], (g1:2)[A1,p3], (g2:2)[A0,p2]',
          '(g0:2)[p0,p2], (g1:2)[A0,p1], (g2:2)[A1,p3]',
          '(g0:2)[p0,p2], (g1:2)[A0,p3], (g2:2)[A1,p1]',
          '(g0:2)[p0,p2], (g1:2)[A1,p1], (g2:2)[A0,p3]',
          '(g0:2)[p0,p2], (g1:2)[A1,p3], (g2:2)[A0,p1]',
          '(g0:2)[p0,p3], (g1:2)[A0,p2], (g2:2)[A1,p1]',
          '(g0:2)[p0,p3], (g1:2)[A0,p1], (g2:2)[A1,p2]',
          '(g0:2)[p0,p3], (g1:2)[A1,p2], (g2:2)[A0,p1]',
          '(g0:2)[p0,p3], (g1:2)[A1,p1], (g2:2)[A0,p2]',
          '(g0:2)[p1,p2], (g1:2)[A0,p0], (g2:2)[A1,p3]',
          '(g0:2)[p1,p2], (g1:2)[A0,p3], (g2:2)[A1,p0]',
          '(g0:2)[p1,p2], (g1:2)[A1,p0], (g2:2)[A0,p3]',
          '(g0:2)[p1,p2], (g1:2)[A1,p3], (g2:2)[A0,p0]',
          '(g0:2)[p1,p3], (g1:2)[A0,p2], (g2:2)[A1,p0]',
          '(g0:2)[p1,p3], (g1:2)[A0,p0], (g2:2)[A1,p2]',
          '(g0:2)[p1,p3], (g1:2)[A1,p2], (g2:2)[A0,p0]',
          '(g0:2)[p1,p3], (g1:2)[A1,p0], (g2:2)[A0,p2]',
          '(g0:2)[p2,p3], (g1:2)[A0,p0], (g2:2)[A1,p1]',
          '(g0:2)[p2,p3], (g1:2)[A0,p1], (g2:2)[A1,p0]',
          '(g0:2)[p2,p3], (g1:2)[A1,p0], (g2:2)[A0,p1]',
          '(g0:2)[p2,p3], (g1:2)[A1,p1], (g2:2)[A0,p0]',
        ].sort())
      })
    })

    describe('when there are more advanced players than needed', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 2},
        {goal: 'g0', teamSize: 2},
        {goal: 'g2', teamSize: 2}, // only one team that needs an advanced player
      ], pool)

      it('returns the expected number of plans', function () {
        const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]
        const nonAdvancedPlayerCount = getNonAdvancedPlayerCount(pool)
        const advancedPlayerCount = getAdvancedPlayerCount(pool)
        const playerCount = advancedPlayerCount + nonAdvancedPlayerCount

        const allValidPlansCount =
          choose(advancedPlayerCount, 1) * // pick an advanced player for the only team that needs one
          choose(playerCount - 1, 1) * // pick a parter for that advanced player
          choose(playerCount - 2, 2)  // pick players for the second team

        // Becuase this method is randon and not exhastive we can't guarantee that ALL of
        // the plans will be retured, just a large subset
        expect(result).to.have.length.gte(allValidPlansCount * 0.8)
      })

      it('returns a subset of the expected plans', function () {
        const result = [...enumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

        const allValidPlans = [
          '(g0:2)[A0,p0], (g0:2)[p1,p2], (g2:2)[A1,p3]',
          '(g0:2)[A0,p0], (g0:2)[p1,p3], (g2:2)[A1,p2]',
          '(g0:2)[A0,p0], (g0:2)[p2,p3], (g2:2)[A1,p1]',
          '(g0:2)[A0,p1], (g0:2)[p0,p2], (g2:2)[A1,p3]',
          '(g0:2)[A0,p1], (g0:2)[p0,p3], (g2:2)[A1,p2]',
          '(g0:2)[A0,p1], (g0:2)[p2,p3], (g2:2)[A1,p0]',
          '(g0:2)[A0,p2], (g0:2)[p0,p1], (g2:2)[A1,p3]',
          '(g0:2)[A0,p2], (g0:2)[p0,p3], (g2:2)[A1,p1]',
          '(g0:2)[A0,p2], (g0:2)[p1,p3], (g2:2)[A1,p0]',
          '(g0:2)[A0,p3], (g0:2)[p0,p1], (g2:2)[A1,p2]',
          '(g0:2)[A0,p3], (g0:2)[p0,p2], (g2:2)[A1,p1]',
          '(g0:2)[A0,p3], (g0:2)[p1,p2], (g2:2)[A1,p0]',
          '(g0:2)[A1,p0], (g0:2)[p1,p2], (g2:2)[A0,p3]',
          '(g0:2)[A1,p0], (g0:2)[p1,p3], (g2:2)[A0,p2]',
          '(g0:2)[A1,p0], (g0:2)[p2,p3], (g2:2)[A0,p1]',
          '(g0:2)[A1,p1], (g0:2)[p0,p2], (g2:2)[A0,p3]',
          '(g0:2)[A1,p1], (g0:2)[p0,p3], (g2:2)[A0,p2]',
          '(g0:2)[A1,p1], (g0:2)[p2,p3], (g2:2)[A0,p0]',
          '(g0:2)[A1,p2], (g0:2)[p0,p1], (g2:2)[A0,p3]',
          '(g0:2)[A1,p2], (g0:2)[p0,p3], (g2:2)[A0,p1]',
          '(g0:2)[A1,p2], (g0:2)[p1,p3], (g2:2)[A0,p0]',
          '(g0:2)[A1,p3], (g0:2)[p0,p1], (g2:2)[A0,p2]',
          '(g0:2)[A1,p3], (g0:2)[p0,p2], (g2:2)[A0,p1]',
          '(g0:2)[A1,p3], (g0:2)[p1,p2], (g2:2)[A0,p0]',
          '(g0:2)[p0,p1], (g0:2)[A0,p2], (g2:2)[A1,p3]',
          '(g0:2)[p0,p1], (g0:2)[A0,p3], (g2:2)[A1,p2]',
          '(g0:2)[p0,p1], (g0:2)[A1,p2], (g2:2)[A0,p3]',
          '(g0:2)[p0,p1], (g0:2)[A1,p3], (g2:2)[A0,p2]',
          '(g0:2)[p0,p1], (g0:2)[p2,p3], (g2:2)[A0,A1]',
          '(g0:2)[p0,p1], (g0:2)[p2,p3], (g2:2)[A0,A1]',
          '(g0:2)[p0,p2], (g0:2)[A0,p1], (g2:2)[A1,p3]',
          '(g0:2)[p0,p2], (g0:2)[A0,p3], (g2:2)[A1,p1]',
          '(g0:2)[p0,p2], (g0:2)[A1,p1], (g2:2)[A0,p3]',
          '(g0:2)[p0,p2], (g0:2)[A1,p3], (g2:2)[A0,p1]',
          '(g0:2)[p0,p2], (g0:2)[p1,p3], (g2:2)[A0,A1]',
          '(g0:2)[p0,p2], (g0:2)[p1,p3], (g2:2)[A0,A1]',
          '(g0:2)[p0,p3], (g0:2)[A0,p1], (g2:2)[A1,p2]',
          '(g0:2)[p0,p3], (g0:2)[A0,p2], (g2:2)[A1,p1]',
          '(g0:2)[p0,p3], (g0:2)[A1,p1], (g2:2)[A0,p2]',
          '(g0:2)[p0,p3], (g0:2)[A1,p2], (g2:2)[A0,p1]',
          '(g0:2)[p0,p3], (g0:2)[p1,p2], (g2:2)[A0,A1]',
          '(g0:2)[p0,p3], (g0:2)[p1,p2], (g2:2)[A0,A1]',
          '(g0:2)[p1,p2], (g0:2)[A0,p0], (g2:2)[A1,p3]',
          '(g0:2)[p1,p2], (g0:2)[A0,p3], (g2:2)[A1,p0]',
          '(g0:2)[p1,p2], (g0:2)[A1,p0], (g2:2)[A0,p3]',
          '(g0:2)[p1,p2], (g0:2)[A1,p3], (g2:2)[A0,p0]',
          '(g0:2)[p1,p2], (g0:2)[p0,p3], (g2:2)[A0,A1]',
          '(g0:2)[p1,p2], (g0:2)[p0,p3], (g2:2)[A0,A1]',
          '(g0:2)[p1,p3], (g0:2)[A0,p0], (g2:2)[A1,p2]',
          '(g0:2)[p1,p3], (g0:2)[A0,p2], (g2:2)[A1,p0]',
          '(g0:2)[p1,p3], (g0:2)[A1,p0], (g2:2)[A0,p2]',
          '(g0:2)[p1,p3], (g0:2)[A1,p2], (g2:2)[A0,p0]',
          '(g0:2)[p1,p3], (g0:2)[p0,p2], (g2:2)[A0,A1]',
          '(g0:2)[p1,p3], (g0:2)[p0,p2], (g2:2)[A0,A1]',
          '(g0:2)[p2,p3], (g0:2)[A0,p0], (g2:2)[A1,p1]',
          '(g0:2)[p2,p3], (g0:2)[A0,p1], (g2:2)[A1,p0]',
          '(g0:2)[p2,p3], (g0:2)[A1,p0], (g2:2)[A0,p1]',
          '(g0:2)[p2,p3], (g0:2)[A1,p1], (g2:2)[A0,p0]',
          '(g0:2)[p2,p3], (g0:2)[p0,p1], (g2:2)[A0,A1]',
          '(g0:2)[p2,p3], (g0:2)[p0,p1], (g2:2)[A0,A1]',
        ]

        result.map(teamFormationPlanToString).forEach(plan => {
          expect(plan).to.be.oneOf(allValidPlans)
        })
      })
    })
  })

  describe('when there are extra seats', function () {
    const pool = buildTestPool({
      playerCount: 3,
      advancedPlayerCount: 2,
      goalCount: 3,
      teamSizes: [2, 2, 2],
      voteDistributionPercentages: [1],
    })

    const teamFormationPlan = {
      seatCount: 6,
      teams: [
        {goalDescriptor: 'g0', teamSize: 2},
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
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

  describe('enumerateAdvancedSeatAssignmentChoices()', function () {
    const pretty = choices => Array.from(choices).map(choice => choice.join(',')).sort()

    it('works there are more seats than players', function () {
      const advancedPlayerInfo = [{id: 'A0', maxTeams: 1}, {id: 'A1', maxTeams: 2}, {id: 'A2', maxTeams: 3}, {id: 'A3', maxTeams: 4}]
      const result = enumerateAdvancedSeatAssignmentChoices(advancedPlayerInfo, 7)
      expect(pretty(result)).to.deep.eq(pretty([
          ['A0', 'A1', 'A2', 'A3', 'A1', 'A2', 'A2'],
          ['A0', 'A1', 'A2', 'A3', 'A1', 'A2', 'A3'],
          ['A0', 'A1', 'A2', 'A3', 'A1', 'A3', 'A3'],
          ['A0', 'A1', 'A2', 'A3', 'A2', 'A2', 'A3'],
          ['A0', 'A1', 'A2', 'A3', 'A2', 'A3', 'A3'],
          ['A0', 'A1', 'A2', 'A3', 'A3', 'A3', 'A3'],
      ]))
    })

    it('works there are fewer seats than players', function () {
      const advancedPlayerInfo = [{id: 'A0', maxTeams: 1}, {id: 'A1', maxTeams: 2}, {id: 'A2', maxTeams: 3}, {id: 'A3', maxTeams: 4}]
      const result = enumerateAdvancedSeatAssignmentChoices(advancedPlayerInfo, 3)
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
        {playerId: 'A0', votes: ['g0', 'g2']},
        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p0', votes: ['g2', 'g1']},
        {playerId: 'p1', votes: ['g0', 'g2']},
        {playerId: 'p2', votes: ['g2', 'g1']},
        {playerId: 'p4', votes: ['g3', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g0', teamSize: 3},
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
        {goalDescriptor: 'g3', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }
    const teamFormationPlan = buildTestTeamFormationPlan([
      {goal: 'g0', teamSize: 3, players: ['A0']},
      {goal: 'g1', teamSize: 3, players: ['A1']},
    ], pool)

    it('returns a valid teamFormationPlan', function () {
      const result = heuristicPlayerAssignment(pool, teamFormationPlan, getNonAdvancedPlayerIds(pool))

      result.teams.forEach(team => {
        expect(team.playerIds).to.have.length(team.teamSize)
        expect(team.playerIds.every(id => id.match(/[Ap]\d/)), 'player ids are all valid').to.be.ok
      })
    })
  })
})
