/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import getCollaboratorsForRepo from '../getCollaboratorsForRepo'

describe(testContext(__filename), function () {
  describe('getCollaboratorsForRepo()', function () {
    it('returns true on success', async function () {
      const owner = 'my-org'
      const repo = 'my-repo'
      const path = `/repos/${owner}/${repo}/collaborators`
      const mockResponse = [{
        login: 'someone',
      }, {
        login: 'anyone',
      }]
      nock('https://api.github.com')
        .get(path)
        .reply(200, mockResponse)

      const collaborators = await getCollaboratorsForRepo(owner, repo)

      expect(collaborators).to.deep.equal(mockResponse)
    })

    it('throws an error if the repository is invalid', async function () {
      const owner = 'my-org'
      const repo = 'invalid-repo'
      const path = `/repos/${owner}/${repo}/collaborators`
      nock('https://api.github.com')
        .put(path)
        .reply(404)

      return expect(getCollaboratorsForRepo(owner, repo)).to.be.rejected
    })
  })
})
