/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import addCollaboratorToRepo from '../addCollaboratorToRepo'

describe(testContext(__filename), function () {
  describe('addCollaboratorToRepo()', function () {
    it('returns true on success', async function () {
      const owner = 'my-org'
      const repo = 'my-repo'
      const username = 'someuser'
      const path = `/repos/${owner}/${repo}/collaborators/${username}`
      nock(config.server.github.baseURL)
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
      nock(config.server.github.baseURL)
        .put(path)
        .reply(404)

      return expect(addCollaboratorToRepo(username, owner, repo)).to.be.rejected
    })

    it('gracefully recovers if the user was already invited', async function () {
      const owner = 'my-org'
      const repo = 'my-repo'
      const username = 'already-invited-user'
      const path = `/repos/${owner}/${repo}/collaborators/${username}`
      const errObj = {
        message: 'Validation Failed',
        errors: [{
          resource: 'Repository',
          code: 'custom',
          message: 'User has already been invited',
        }],
      }
      nock(config.server.github.baseURL)
        .put(path)
        .reply(422, errObj)

      return expect(addCollaboratorToRepo(username, owner, repo)).to.not.be.rejected
    })
  })
})
