/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import AdvancedPlayersGotTheirVoteAppraiser from '../AdvancedPlayersGotTheirVoteAppraiser'

const SECOND_CHOICE_VALUE = AdvancedPlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE

describe(testContext(__filename), function () {
  const REGULAR_PLAYER_1ST_CHOICE = 'g1'
  const REGULAR_PLAYER_2ND_CHOICE = 'g2'
  const ADVANCED_PLAYER_1 = 'A1'
  const ADVANCED_PLAYER_2 = 'A2'
  const ADVANCED_PLAYER_1_1ST_CHOICE = 'g1'
  const ADVANCED_PLAYER_1_2ND_CHOICE = 'g2'
  const ADVANCED_PLAYER_2_1ST_CHOICE = 'g3'
  const ADVANCED_PLAYER_2_2ND_CHOICE = 'g2'
  const pool = {
    votes: [
      {playerId: ADVANCED_PLAYER_1, votes: [ADVANCED_PLAYER_1_1ST_CHOICE, ADVANCED_PLAYER_1_2ND_CHOICE]},
      {playerId: ADVANCED_PLAYER_2, votes: [ADVANCED_PLAYER_2_1ST_CHOICE, ADVANCED_PLAYER_2_2ND_CHOICE]},
      {playerId: 'p1', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p2', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p3', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p4', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p5', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p6', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p7', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p8', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
    ],
    goals: [
      {goalDescriptor: 'g1', teamSize: 4},
      {goalDescriptor: 'g2', teamSize: 4},
      {goalDescriptor: 'g3', teamSize: 4},
      {goalDescriptor: 'g4', teamSize: 4},
    ],
    advancedPlayers: [{id: ADVANCED_PLAYER_1}, {id: ADVANCED_PLAYER_2}],
  }

  it('returns the percentage of advanced players who can get their first vote', function () {
    const teamFormationPlan = {
      seatCount: 10,
      teams: [
        {
          goalDescriptor: ADVANCED_PLAYER_1_1ST_CHOICE,
          teamSize: 5,
          playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
        },
        {
          goalDescriptor: ADVANCED_PLAYER_2_1ST_CHOICE,
          teamSize: 5,
          playerIds: [],
        },
      ]
    }

    const appriaser = new AdvancedPlayersGotTheirVoteAppraiser(pool)
    const score = appriaser.score(teamFormationPlan)

    expect(score).to.eq(1)
  })

  it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
    const teamFormationPlan = {
      seatCount: 10,
      teams: [
        {
          goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
          teamSize: 5,
          playerIds: [ADVANCED_PLAYER_1, 'p5', 'p6', 'p7', 'p8'],
        },
        {
          goalDescriptor: ADVANCED_PLAYER_2_1ST_CHOICE,
          teamSize: 5,
          playerIds: [],
        },
      ]
    }

    const appriaser = new AdvancedPlayersGotTheirVoteAppraiser(pool)
    const score = appriaser.score(teamFormationPlan)

    expect(score).to.eq(0.5 + (SECOND_CHOICE_VALUE / 2))
  })

  it('does not score players who got their vote and are on two teams twice', function () {
    const teamFormationPlan = {
      seatCount: 11,
      teams: [
        {
          goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
          teamSize: 3,
          playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2'],
        },
        {
          goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
          teamSize: 3,
          playerIds: [ADVANCED_PLAYER_1, 'p3', 'p4'],
        },
        {
          goalDescriptor: ADVANCED_PLAYER_2_1ST_CHOICE,
          teamSize: 5,
          playerIds: [],
        },
      ]
    }

    const appriaser = new AdvancedPlayersGotTheirVoteAppraiser(pool)
    const score = appriaser.score(teamFormationPlan)

    expect(score).to.eq(0.5 + (SECOND_CHOICE_VALUE / 2))
  })

  it('works when extra seats are in play', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},
        {playerId: 'p5', votes: ['g1', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
        {goalDescriptor: 'g3', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
    }

    const teamFormationPlan = {
      seatCount: 9,
      teams: [
        ['g1', 3], ['g1', 3], ['g2', 3]
      ].map(([goalDescriptor, teamSize]) => ({goalDescriptor, teamSize, playerIds: []})),
    }

    const appriaser = new AdvancedPlayersGotTheirVoteAppraiser(pool)
    const score = appriaser.score(teamFormationPlan)

    expect(score).to.eq(0.85)
  })
})
