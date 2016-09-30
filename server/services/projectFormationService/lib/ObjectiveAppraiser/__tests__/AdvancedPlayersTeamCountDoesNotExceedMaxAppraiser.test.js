/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import AdvancedPlayersTeamCountDoesNotExceedMaxAppraiser from '../AdvancedPlayersTeamCountDoesNotExceedMaxAppraiser'

describe(testContext(__filename), function () {
  it('returns the percentage of advanced players whose team max was respected', function () {
    const pool = {
      advancedPlayers: [
        {id: 'A1', maxTeams: 1},
        {id: 'A2', maxTeams: 2}
      ]
    }
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
        {goalDescriptor: 'g2', playerIds: ['A1', 'p3', 'p4']},
        {goalDescriptor: 'g3', playerIds: ['A2', 'p5', 'p6']},
      ]
    }

    const appraiser = new AdvancedPlayersTeamCountDoesNotExceedMaxAppraiser(pool)
    const score = appraiser.score(teamFormationPlan)

    expect(score).to.eq(1 / 2)
  })

  context('teams are not complete', function () {
    it('returns the percentage of advanced players who could end up with their maxTeams respected', function () {
      const pool = {
        advancedPlayers: [
          {id: 'A1', maxTeams: 1},
          {id: 'A2', maxTeams: 2}
        ]
      }
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
          {goalDescriptor: 'g2', playerIds: ['A1', 'p3', 'p4']},
        ]
      }

      const appraiser = new AdvancedPlayersTeamCountDoesNotExceedMaxAppraiser(pool)
      const score = appraiser.score(teamFormationPlan, {teamsAreIncomplete: true})

      expect(score).to.eq(1 / 2)
    })

    it('compares team count to unassigned advanced player capacity', function () {
      const pool = {
        advancedPlayers: [
          {id: 'A1', maxTeams: 1},
          {id: 'A2', maxTeams: 2}
        ]
      }
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', playerIds: ['A1']},
          {goalDescriptor: 'g1', playerIds: []},
          {goalDescriptor: 'g1', playerIds: []},
          {goalDescriptor: 'g1', playerIds: []},
        ]
      }

      const appraiser = new AdvancedPlayersTeamCountDoesNotExceedMaxAppraiser(pool)
      const score = appraiser.score(teamFormationPlan, {teamsAreIncomplete: true})

      expect(score).to.eq(1 / 2)
    })
  })
})
