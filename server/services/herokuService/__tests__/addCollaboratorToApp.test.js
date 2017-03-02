/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import addCollaboratorToApp from '../addCollaboratorToApp'

describe(testContext(__filename), function () {
  describe('addCollaboratorToApp()', function () {
    it('returns true on success', async function () {
      const user = 'me@example.com'
      const app = 'my-app'
      const path = `/apps/${app}/collaborators`
      const mockResponse = {
        app: {name: 'my-app'},
        user: {email: user},
      }
      nock('https://api.heroku.com')
        .post(path, {user})
        .reply(201, mockResponse)

      const response = await addCollaboratorToApp(user, app)

      expect(response).to.equal(true)
    })

    it('throws an error if the user cannot be added', async function () {
      const user = 'me@example.com'
      const app = 'my-app'
      const path = `/apps/${app}/collaborators`
      nock('https://api.heroku.com')
        .post(path, {user})
        .reply(500)

      return expect(addCollaboratorToApp(user, app)).to.be.rejected
    })
  })
})
