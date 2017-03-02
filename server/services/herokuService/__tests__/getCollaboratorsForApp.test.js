/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import getCollaboratorsForApp from '../getCollaboratorsForApp'

describe(testContext(__filename), function () {
  describe('getCollaboratorsForApp()', function () {
    it('returns true on success', async function () {
      const app = 'my-app'
      const path = `/apps/${app}/collaborators`
      const mockResponse = [{
        app: {name: 'my-app'},
        user: {email: 'him@example.com'},
      }, {
        app: {name: 'my-app'},
        user: {email: 'her@example.com'}
      }]
      nock(config.server.heroku.baseURL)
        .get(path)
        .reply(200, mockResponse)

      const collaborators = await getCollaboratorsForApp(app)

      expect(collaborators).to.deep.equal(mockResponse)
    })

    it('throws an error if the app does not exist', async function () {
      const app = 'invalid-app'
      const path = `/apps/${app}/collaborators`
      nock(config.server.heroku.baseURL)
        .get(path)
        .reply(404)

      return expect(getCollaboratorsForApp(app)).to.be.rejected
    })
  })
})
