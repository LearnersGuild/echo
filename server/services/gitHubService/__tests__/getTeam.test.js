/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import getTeam from '../getTeam'

describe(testContext(__filename), function () {
  describe('getTeam()', function () {
    before(function () {
      this.owner = 'owner'
      this.name = 'team-name'
      this.mockTeamsNotFound = [{
        name: 'not-my-team',
        description: 'something',
      }]
      this.mockTeamsFound = this.mockTeamsNotFound.concat([{
        name: this.name,
        description: 'something else',
      }])
    })

    it('returns null if there is no such team', async function () {
      nock('https://api.github.com')
        .get(`/orgs/${this.owner}/teams`)
        .reply(200, this.mockTeamsNotFound)

      const team = await getTeam(this.owner, this.name)

      expect(team).to.equal(null)
    })

    it('returns the correct team if it is found', async function () {
      nock('https://api.github.com')
        .get(`/orgs/${this.owner}/teams`)
        .reply(200, this.mockTeamsFound)

      const team = await getTeam(this.owner, this.name)

      expect(team).to.deep.equal(this.mockTeamsFound[1])
    })
  })
})
