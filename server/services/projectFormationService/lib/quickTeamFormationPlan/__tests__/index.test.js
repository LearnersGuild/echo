/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {buildTestPool} from '../../../__tests__/helpers'

import {
  getQuickTeamFormationPlan,
} from '../index'

import {getAssignedPlayerIds} from '../../teamFormationPlan'

describe(testContext(__filename), function () {
  it('builds suboptimal teamFormationPlan quickly', function () {
    const pool = buildTestPool({advancedPlayerCount: 10, playerCount: 32, teamSize: 4, goalCount: 10})
    const teamFormationPlan = getQuickTeamFormationPlan(pool)

    expect(teamFormationPlan.teams).to.have.length(11)

    teamFormationPlan.teams.forEach(team => {
      expect(team.goalDescriptor, 'all teams have the same goal').to.eq(teamFormationPlan.teams[0].goalDescriptor)
    })

    expect(getAssignedPlayerIds(teamFormationPlan)).to.have.length(42)
  })

  it('works with teams of size 2', function () {
    const pool = buildTestPool({advancedPlayerCount: 10, playerCount: 32, teamSize: 2, goalCount: 10})
    const teamFormationPlan = getQuickTeamFormationPlan(pool)

    expect(teamFormationPlan.teams).to.have.length(21)

    teamFormationPlan.teams.forEach(team => {
      expect(team.goalDescriptor, 'all teams have the same goal').to.eq(teamFormationPlan.teams[0].goalDescriptor)
    })

    expect(getAssignedPlayerIds(teamFormationPlan)).to.have.length(42)
  })
})
