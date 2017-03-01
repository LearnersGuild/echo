/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import addCollaboratorToRepo from '../addCollaboratorToRepo'

describe(testContext(__filename), function () {
  describe('addCollaboratorToRepo()', function () {
    it('returns true on success', async function () {
      const owner = 'my-org'
      const repo = 'my-repo'
      const username = 'someuser'
      const path = `/repos/${owner}/${repo}/collaborators/${username}`
      nock('https://api.github.com')
        .put(path)
        .reply(204)

      const response = await addCollaboratorToRepo(username, owner, repo)

      expect(response).to.equal(true)
    })

    it('throws an error if the username is invalid', async function () {
      const owner = 'my-org'
      const repo = 'my-repo'
      const username = '-this-username-is-invalid-'
      const path = `/repos/${owner}/${repo}/collaborators/${username}`
      nock('https://api.github.com')
        .put(path)
        .reply(404)

      return expect(addCollaboratorToRepo(username, owner, repo)).to.be.rejected
    })
  })
})
