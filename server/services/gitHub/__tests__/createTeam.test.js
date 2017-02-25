/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import createTeam from '../createTeam'

describe(testContext(__filename), function () {
  describe('createTeam()', function () {
    it('returns the team info after it is created', async function () {
      const mockTeam = {
        id: 1,
        name: 'team-name',
        description: 'something',
        repos_count: 2, // eslint-disable-line camelcase
      }
      nock('https://api.github.com')
        .post('/orgs/owner/teams')
        .reply(201, mockTeam)

      const team = await createTeam(mockTeam.name, mockTeam.description, 'owner', ['repo1, repo2'], 'push')

      expect(team).to.deep.equal(mockTeam)
    })
  })
})
