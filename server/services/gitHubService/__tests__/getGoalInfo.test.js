/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import getGoalInfo from '../getGoalInfo'

describe(testContext(__filename), function () {
  describe('getGoalInfo()', function () {
    before(function () {
      this.orgAndRepo = 'org/goal-repo'
      this.goalRepoURL = `https://github.com/${this.orgAndRepo}`
      this.goalNumber = '55'
      this.goalURL = `${this.goalRepoURL}/issues/${this.goalNumber}`
    })

    it('throws an error if unsuccessful', function () {
      nock('https://api.github.com')
        .get(`/repos/${this.orgAndRepo}/issues/${this.goalNumber}`)
        .reply(500, 'Internal Server Error')

      expect(getGoalInfo(this.goalRepoURL, this.goalNumber)).to.be.rejected
    })

    it('returns null if there is no such goal', async function () {
      nock('https://api.github.com')
        .get(`/repos/${this.orgAndRepo}/issues/${this.goalNumber}`)
        .reply(404, 'Not Found')

      const goalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

      expect(goalInfo).to.equal(null)
    })

    it('returns the correct goal info if it is found', async function () {
      const mockIssue = {
        html_url: this.goalURL, // eslint-disable-line camelcase
        title: 'goal title',
        labels: [{name: 'team-size-2'}],
      }
      const mockGoalInfo = {
        url: this.goalURL,
        title: mockIssue.title,
        teamSize: 2,
        githubIssue: mockIssue,
      }
      nock('https://api.github.com')
        .get(`/repos/${this.orgAndRepo}/issues/${this.goalNumber}`)
        .reply(200, mockIssue)

      const goalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

      expect(goalInfo).to.deep.equal(mockGoalInfo)
    })
  })
})
