/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import getGoalInfo from '../getGoalInfo'

describe(testContext(__filename), function () {
  describe('getGoalInfo()', function () {
    before(function () {
      this.goalLibraryURL = config.server.goalLibrary.baseURL
      this.goalNumber = '55'
      this.goalURL = `${this.goalLibraryURL}/api/goals/${this.goalNumber}.json`
    })

    it('throws an error if unsuccessful', function () {
      nock(this.goalLibraryURL)
        .get(`/api/goals/${this.goalNumber}.json`)
        .reply(500, 'Internal Server Error')

      return expect(getGoalInfo(this.goalNumber)).to.be.rejected
    })

    it('returns null if there is no such goal', async function () {
      nock(this.goalLibraryURL)
        .get(`/api/goals/${this.goalNumber}.json`)
        .reply(404, 'Not Found')

      const goalInfo = await getGoalInfo(this.goalNumber)

      expect(goalInfo).to.equal(null)
    })

    it('returns the correct goal info if it is found', async function () {
      const mockGoalAPIResponse = {
        authors: ['@jrob8577'],
        teamSize: 2,
        issueNumber: 104,
        title: 'Work on Dragonboard',
        createdAt: '2016-10-28T22:35:46Z',
        labels: ['apprentice'],
        published: true,
        level: '2',
        redirect_from: `/goals/${this.goalNumber}`, // eslint-disable-line camelcase
        content: 'the goal content',
      }
      const mockGoalInfo = {
        ...mockGoalAPIResponse,
        url: `${this.goalLibraryURL}/api${mockGoalAPIResponse.redirect_from}.json`,
      }
      nock(this.goalLibraryURL)
        .get(`/api/goals/${this.goalNumber}.json`)
        .reply(200, mockGoalAPIResponse)

      const goalInfo = await getGoalInfo(this.goalNumber)

      expect(goalInfo).to.deep.equal(mockGoalInfo)
    })
  })
})
