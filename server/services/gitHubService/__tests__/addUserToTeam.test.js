/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import addUserToTeam from '../addUserToTeam'

describe(testContext(__filename), function () {
  describe('addUserToTeam()', function () {
    it('returns the team info after it is created', async function () {
      const teamId = 123
      const username = 'someuser'
      const path = `/teams/${teamId}/memberships/${username}`
      const mockResponse = {
        url: `https://api.github.com${path}`,
        role: 'member',
        state: 'active',
      }
      nock(config.server.github.baseURL)
        .put(path)
        .reply(201, mockResponse)

      const response = await addUserToTeam(username, teamId)

      expect(response).to.deep.equal(mockResponse)
    })
  })
})
