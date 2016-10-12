/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import PlayersGotTheirVoteAppraiser from '../PlayersGotTheirVoteAppraiser'

const SECOND_CHOICE_VALUE = PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE

describe(testContext(__filename), function () {
  const REGULAR_PLAYER_1ST_CHOICE = 'g1'
  const REGULAR_PLAYER_2ND_CHOICE = 'g2'
  const ADVANCED_PLAYER_1 = 'A1'
  const ADVANCED_PLAYER_2 = 'A2'
  const ADVANCED_PLAYER_IDS = [ADVANCED_PLAYER_1, ADVANCED_PLAYER_2]
  const ADVANCED_PLAYER_1_1ST_CHOICE = 'g1'
  const ADVANCED_PLAYER_1_2ND_CHOICE = 'g2'
  const ADVANCED_PLAYER_2_1ST_CHOICE = 'g3'
  const ADVANCED_PLAYER_2_2ND_CHOICE = 'g2'
  const GOAL_WITH_NO_VOTES = 'g4'
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

  describe('with complete teams', function () {
    it('returns the percentage of players who got their first vote', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(1 / 2)
    })

    it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(SECOND_CHOICE_VALUE / 2)
    })

    context('considering only a subset of players', function () {
      it('returns the percentage of advanced players who got their first vote', function () {
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
              playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const appriaser = new PlayersGotTheirVoteAppraiser(pool, ADVANCED_PLAYER_IDS)
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
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
            {
              goalDescriptor: GOAL_WITH_NO_VOTES,
              teamSize: 5,
              playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const appriaser = new PlayersGotTheirVoteAppraiser(pool, ADVANCED_PLAYER_IDS)
        const score = appriaser.score(teamFormationPlan)
        expect(score).to.eq(SECOND_CHOICE_VALUE / 2)
      })
    })

    it('does not score players who got their vote and are on two teams twice', function () {
      const teamFormationPlan = {
        seatCount: 13,
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
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool, ADVANCED_PLAYER_IDS)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(SECOND_CHOICE_VALUE / 2)
    })
  })

  describe('with incomplete teams', function () {
    it('correctly handles teamFormationPlans without all of the goals selected', function () {
      const pool = {
        votes: [
          {playerId: 'A0', votes: ['g0', 'g1']},
          {playerId: 'A1', votes: ['g1', 'g0']},
          {playerId: 'p0', votes: ['g0', 'g1']},
          {playerId: 'p1', votes: ['g1', 'g0']},
          {playerId: 'p2', votes: ['g0', 'g1']},
          {playerId: 'p3', votes: ['g1', 'g0']},
          {playerId: 'p4', votes: ['g0', 'g1']},
          {playerId: 'p5', votes: ['g1', 'g0']},
        ],
        goals: [
          {goalDescriptor: 'g0', teamSize: 3},
          {goalDescriptor: 'g1', teamSize: 3},
        ],
        advancedPlayers: [{id: 'A0'}, {id: 'A1'}]
      }
      const teamFormationPlan = {
        seatCount: 9,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
            teamSize: 3,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })

    it('works when no players have been assigned at all', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })

    it('returns the percentage of players who can get their vote', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })

    it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(
        // half already have their first choice
        0.5 +
        // everyone else can get their 2nd choice (except the snd advanced player)
        (SECOND_CHOICE_VALUE / 2) - (0.1)
      )
    })

    it('considers unassigned players votes and what goals have already been chosen', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(0.5)
    })

    it('considers unassigned players votes and what goals have already been chosen 2', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: REGULAR_PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: REGULAR_PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(SECOND_CHOICE_VALUE)
    })

    it('takes into consideration that if a goal has been chosen some players MUST fill those seats', function () {
      const pool = {
        votes: [
          {playerId: 'A0', votes: ['g0', 'g3']},
          {playerId: 'p0', votes: ['g0', 'g3']},
          {playerId: 'A1', votes: ['g2', 'g3']},
          {playerId: 'p1', votes: ['g2', 'g3']},
          {playerId: 'p2', votes: ['g2', 'g3']},
          {playerId: 'p3', votes: ['g2', 'g3']},
          {playerId: 'p4', votes: ['g2', 'g3']},
          {playerId: 'p5', votes: ['g2', 'g3']},
        ],
        goals: [
          {goalDescriptor: 'g0', teamSize: 3},
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
          {goalDescriptor: 'g3', teamSize: 3},
        ],
        advancedPlayers: [{id: 'A0'}, {id: 'A1'}]
      }
      const teamFormationPlan = {
        seatCount: 8,
        teams: [
          {
            goalDescriptor: 'g0',
            teamSize: 4,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(6 / 8)
    })

    context('considering only a subset of players', function () {
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

        const appriaser = new PlayersGotTheirVoteAppraiser(pool, ADVANCED_PLAYER_IDS)
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

        const appriaser = new PlayersGotTheirVoteAppraiser(pool, ADVANCED_PLAYER_IDS)
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

        const appriaser = new PlayersGotTheirVoteAppraiser(pool, ADVANCED_PLAYER_IDS)
        const score = appriaser.score(teamFormationPlan)

        expect(score).to.eq(0.5 + (SECOND_CHOICE_VALUE / 2))
      })
    })
  })
})
