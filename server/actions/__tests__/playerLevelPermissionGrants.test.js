/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'

import config from 'src/config'
import {mapById} from 'src/common/util'

import factory from 'src/test/factories'
import {useFixture, withDBCleanup} from 'src/test/helpers'

import {
  githubReposForLevel,
  herokuAppsForLevel,
  getAPIGrantPromises,
} from '../playerLevelPermissionGrants'

describe(testContext(__filename), function () {
  describe('getAPIGrantPromises', function () {
    withDBCleanup()

    beforeEach(async function () {
      useFixture.nockClean()
    })

    it('gets API call promises for only new collaborators', async function () {
      const level = 4
      const playerAttrs = Array.from(Array(3).keys()).map(() => ({stats: {level}}))
      const players = await factory.createMany('player', playerAttrs, playerAttrs.length)
      const playersById = mapById(players)
      const userAttrs = players.map(player => ({id: player.id}))
      const users = await factory.buildMany('user', userAttrs, players.length)
      const mergedUsers = users.map(user => ({...user, ...playersById.get(user.id)}))

      // assume the first user is already a collaborator
      const existingCollaborators = mergedUsers.slice(0, 1)
      const newCollaboraborators = mergedUsers.slice(1)

      // nock and track the GitHub API calls
      const expectedRepos = githubReposForLevel(level)
      const reposHandles = {}
      expectedRepos.forEach(repo => {
        reposHandles[repo] = []
        const path = `/repos/${repo}/collaborators`
        nock(config.server.github.baseURL)
          .persist()
          .get(path)
          .reply(200, () =>
            existingCollaborators.map(_ => ({login: _.handle}))
          )
          .put(uri => {
            if (!uri.includes(path)) {
              return false
            }
            const handle = uri.replace(`${path}/`, '')
            // track which users had API calls
            reposHandles[repo].push(handle)
            return true
          })
          .reply(204)
      })

      // nock and track the Heroku API calls
      const expectedApps = herokuAppsForLevel(level)
      const appsEmails = {}
      expectedApps.forEach(app => {
        appsEmails[app] = []
        const path = `/apps/${app}/collaborators`
        nock(config.server.heroku.baseURL)
          .persist()
          .get(path)
          .reply(200, () =>
            existingCollaborators.map(_ => ({user: {email: _.email}}))
          )
          .post(path)
          .reply(201, (uri, body) => {
            // track which users had API calls
            appsEmails[app].push(body.user)
            return {app: {name: app}}
          })
      })

      const apiPromises = await getAPIGrantPromises(mergedUsers, expectedRepos, expectedApps)
      await Promise.all(apiPromises)

      const expectedHandles = newCollaboraborators.map(_ => _.handle)
      expectedRepos.forEach(repo => expect(reposHandles[repo]).to.deep.equal(expectedHandles))

      const expectedEmails = newCollaboraborators.map(_ => _.email)
      expectedApps.forEach(app => expect(appsEmails[app]).to.deep.equal(expectedEmails))
    })
  })
})
