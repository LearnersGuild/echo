/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import profiler from '../lib/util/profiler'
import {buildTestPool} from '../lib/util/helpers'
import {teamFormationPlanToString} from '../lib/teamFormationPlan'

import {getTeamFormationPlan} from '../index'

describe(testContext(__filename), function () {
  it('works when everyone votes for the same goal', function () {
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
        {goalDescriptor: 'g1', teamSize: 4},
        {goalDescriptor: 'g2', teamSize: 4},
        {goalDescriptor: 'g3', teamSize: 4},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }

    const {teams} = getTeamFormationPlan(pool)

    expect(teams).to.have.length(2)

    teams.forEach(team => {
      expect(team.goalDescriptor).to.eq('g1')
      expect(team.playerIds).to.have.length(4)
      expect(
        team.playerIds.includes('A0') ||
        team.playerIds.includes('A1'),
        'team includes an advanced player'
      ).to.be.ok
    })
  })

  it('respects the advancedPlayers maxTeams if present', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p2', votes: ['g2', 'g2']},
        {playerId: 'p3', votes: ['g2', 'g1']},
        {playerId: 'p4', votes: ['g2', 'g1']},
        {playerId: 'p5', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 1}],
    }

    const {teams} = getTeamFormationPlan(pool)

    expect(
      _teamCountFor('A0', teams),
      'Advanced Player 0 is given the appropriate number of teams'
    ).to.eq(2)

    expect(
      _teamCountFor('A1', teams),
      'Advanced Player 0 is given the appropriate number of teams'
    ).to.eq(1)
  })

  it('works when two goals tie for most popular', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p3', votes: ['g2', 'g1']},
        {playerId: 'p4', votes: ['g2', 'g1']},
        {playerId: 'p5', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 4},
        {goalDescriptor: 'g2', teamSize: 4},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 3}],
    }

    const {teams} = getTeamFormationPlan(pool)

    expect(teams).to.have.length(2)

    for (const goalDescriptor of ['g1', 'g2']) {
      const team = teams.find(_ => _.goalDescriptor === goalDescriptor)

      expect(team, 'a team is formed for each most popular goal').to.be
      expect(team.playerIds, 'each team has an advanced player').to.match(/A/)
      expect(team.playerIds, 'each team has an advanced player').to.match(/A/)
      expect(team.playerIds, 'each team gets half the players').to.have.length(4)
    }
  })

  it('will put an advanced player on multiple teams if needed', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},

        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p7', votes: ['g2', 'g1']},
        {playerId: 'p8', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 1}],
    }

    const {teams} = getTeamFormationPlan(pool)

    expect(teams).to.have.length(3)

    const [team1, team2] = teams.filter(_ => _.goalDescriptor === 'g1')
    const [team3] = teams.filter(_ => _.goalDescriptor === 'g2')

    expect(team1, 'two teams are formed with goal g1').to.be.ok
    expect(team2, 'two teams are formed with goal g1').to.be.ok
    expect(team3, 'one team is formed with goal g2').to.be.ok
    expect(team1.playerIds).to.include('A0')
    expect(team2.playerIds).to.include('A0')
    expect(team3.playerIds).to.include('A1')
  })

  it('will throw an error if no solution can be found', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},

        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p5', votes: ['g2', 'g1']},
        {playerId: 'p6', votes: ['g2', 'g1']},
        {playerId: 'p7', votes: ['g2', 'g1']},
        {playerId: 'p8', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 1}, {id: 'A1', maxTeams: 1}],
    }

    expect(() => getTeamFormationPlan(pool)).to.throw()
  })

  it.skip('will put multiple advanced players on a team if needed', function () {
    // TODO: make this pass
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},

        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'A2', votes: ['g2', 'g1']},
        {playerId: 'p5', votes: ['g2', 'g1']},
        {playerId: 'p6', votes: ['g2', 'g1']},
        {playerId: 'p7', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 5},
        {goalDescriptor: 'g2', teamSize: 5},
      ],
      advancedPlayers: [{id: 'A0', maxTeams: 3}, {id: 'A1', maxTeams: 1}, {id: 'A2', maxTeams: 1}],
    }

    const {teams} = getTeamFormationPlan(pool)

    expect(teams).to.have.length(2)

    const [team1] = teams.filter(_ => _.goalDescriptor === 'g1')
    const [team2] = teams.filter(_ => _.goalDescriptor === 'g2')

    expect(team1, 'one team is formed with goal g1').to.be.ok
    expect(team2, 'one team is formed with goal g2').to.be.ok
    expect(team1.playerIds).to.include('A0')
    expect(team2.playerIds).to.include('A1')
    expect(team2.playerIds).to.include('A2')
  })

  describe.skip('performance tests', function () {
    beforeEach(function () {
      profiler.reset()
      console.log(new Date())
    })

    const minutes = n => n * 60000
    const scenarios = [
      // 0
      {
        pool: buildTestPool({advancedPlayerCount: 4, playerCount: 15, teamSize: 4, goalCount: 5}),
        expectedRuntime: minutes(0.25),
        minResultScore: 0.95,
      },
      // 1
      {
        pool: buildTestPool({
          advancedPlayerCount: 10,
          advancedPlayerMaxTeams: [3, 3, 1, 1, 1, 1, 1, 1, 1, 1],
          playerCount: 30,
          teamSize: 4,
          goalCount: 5,
        }),
        expectedRuntime: minutes(0.25),
        minResultScore: 0.95,
      },
      // 2
      {
        pool: buildTestPool({advancedPlayerCount: 4, playerCount: 30, teamSize: 4, goalCount: 5}),
        expectedRuntime: minutes(0.50),
        minResultScore: 0.95,
      },
      // 3
      {
        pool: buildTestPool({advancedPlayerCount: 4, playerCount: 30, teamSize: 4, goalCount: 12}),
        expectedRuntime: minutes(2.50),
        minResultScore: 0.925,
      },
      // 4
      {
        pool: buildTestPool({
          advancedPlayerCount: 10,
          advancedPlayerMaxTeams: [3, 3, 1, 1, 1, 1, 1, 1, 1, 1],
          playerCount: 30,
          teamSize: 4,
          goalCount: 5,
        }),
        expectedRuntime: minutes(0.25),
        minResultScore: 0.95,
      },
      // 5
      {
        pool: buildTestPool({
          advancedPlayerCount: 9,
          advancedPlayerMaxTeams: [3, 3, 1, 1, 1, 1, 1, 1, 1, 1],
          playerCount: 28,
          teamSize: 4,
          goalCount: 5,
        }),
        expectedRuntime: minutes(0.40),
        minResultScore: 0.85,
      },
      // 6
      {
        pool: buildTestPool({
          advancedPlayerCount: 10,
          advancedPlayerMaxTeams: [3, 3, 1, 1, 1, 1, 1, 1, 1, 1],
          playerCount: 30,
          teamSize: 4,
          goalCount: 12,
        }),
        expectedRuntime: minutes(5),
        minResultScore: 0.95,
      },
    ]

    scenarios.forEach(({pool, minResultScore, expectedRuntime}, i) => {
      const expectedMinutes = (expectedRuntime / 60000).toFixed(2)
      it(`completes scenario [${i}] in under ${expectedMinutes} minutes`, function () {
        this.timeout(expectedRuntime + minutes(1))
        const start = Date.now()

        const teamFormationPlan = getTeamFormationPlan(pool)
        console.log('result:', teamFormationPlanToString(teamFormationPlan), teamFormationPlan.score)

        const elapsedMilliseconds = Date.now() - start
        console.log('scenario', i, 'completed in', (elapsedMilliseconds / 60000).toFixed(2), 'minutes')

        expect(elapsedMilliseconds).to.be.lt(expectedRuntime)
        expect(teamFormationPlan.score).to.be.gt(minResultScore)
      })
    })

    afterEach(function () {
      profiler.report()
    })
  })
})

function _teamCountFor(playerId, teams) {
  return teams.reduce(
    (result, {playerIds}) => playerIds.includes(playerId) ? result + 1 : result, 0
  )
}
