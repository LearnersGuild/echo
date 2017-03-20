/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
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
      nock(config.server.github.baseURL)
        .get(`/repos/${this.orgAndRepo}/issues/${this.goalNumber}`)
        .reply(500, 'Internal Server Error')

      expect(getGoalInfo(this.goalRepoURL, this.goalNumber)).to.be.rejected
    })

    it('returns null if there is no such goal', async function () {
      nock(config.server.github.baseURL)
        .get(`/repos/${this.orgAndRepo}/issues/${this.goalNumber}`)
        .reply(404, 'Not Found')

      const goalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

      expect(goalInfo).to.equal(null)
    })

    describe('when there is a goal', async function () {
      beforeEach(function () {
        this.mockIssue = {
          html_url: this.goalURL, // eslint-disable-line camelcase
          title: 'goal title',
          labels: [{name: 'team-size-2'}],
        }
        this.mockGoalInfo = {
          url: this.goalURL,
          title: this.mockIssue.title,
          teamSize: 2,
          githubIssue: this.mockIssue,
        }
        this.nockGitHub = function (issue) {
          nock(config.server.github.baseURL)
            .get(`/repos/${this.orgAndRepo}/issues/${this.goalNumber}`)
            .reply(200, issue)
        }
      })

      it('returns the correct goal info if it is found', async function () {
        this.nockGitHub(this.mockIssue)
        const goalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

        expect(goalInfo).to.deep.equal(this.mockGoalInfo)
      })

      context('rejects an invalid team size', function () {
        it('returns null if team size is negative', async function () {
          const invalidMockIssue = {
            html_url: this.goalURL,
            title: 'goal title',
            labels: [{name: 'team-size--2'}]
          }
          this.nockGitHub(invalidMockIssue)
          const invalidGoalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

          expect(invalidGoalInfo.teamSize).to.be.null
        })

        it('returns null if team size is NaN', async function () {
          const invalidMockIssue = {
            html_url: this.goalURL,
            title: 'goal title',
            labels: [{name: 'team-size-A'}]
          }
          this.nockGitHub(invalidMockIssue)
          const invalidGoalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

          expect(invalidGoalInfo.teamSize).to.be.null
        })

        it('returns null if the team size is greater than nine', async function () {
          const invalidMockIssue = {
            html_url: this.goalURL,
            title: 'goal title',
            labels: [{name: 'team-size-10'}]
          }
          this.nockGitHub(invalidMockIssue)
          const invalidGoalInfo = await getGoalInfo(this.goalRepoURL, this.goalURL)

          expect(invalidGoalInfo.teamSize).to.be.null
        })
      })
    })
  })
})
