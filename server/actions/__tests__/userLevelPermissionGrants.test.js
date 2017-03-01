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
} from '../userLevelPermissionGrants'

describe(testContext(__filename), function () {
  describe('getAPIGrantPromises', function () {
    withDBCleanup()

    beforeEach(async function () {
      const numLevels = 6
      const playerAttrs = Array.from(Array(numLevels).keys()).map(level => ({stats: {level}}))
      const players = await factory.createMany('player', playerAttrs, numLevels)
      const playersById = mapById(players)
      const userAttrs = players.map(player => ({id: player.id}))
      const users = await factory.buildMany('user', userAttrs, players.length)
      this.mergedUsers = users.map(user => ({...user, ...playersById.get(user.id)}))
      useFixture.nockClean()
    })

    it('grants users collaborator access to the right repos and apps', async function () {
      const userRepos = {}
      const userApps = {}
      this.mergedUsers.forEach(user => {
        userRepos[user.id] = []
        const expectedRepos = githubReposForLevel(user.stats.level)
        expectedRepos.forEach(repo => {
          const path = `/repos/${repo}/collaborators/${user.handle}`
          nock(config.server.github.baseURL)
            .put(path)
            .reply(204, () => {
              userRepos[user.id].push(repo)
            })
        })

        userApps[user.id] = []
        const expectedApps = herokuAppsForLevel(user.stats.level)
        expectedApps.forEach(app => {
          const path = `/apps/${app}/collaborators`
          nock(config.server.heroku.baseURL)
            .post(path)
            .reply(201, () => {
              userApps[user.id].push(app)
              return {app: {name: app}}
            })
        })
      })

      const apiPromises = getAPIGrantPromises(this.mergedUsers)
      await Promise.all(apiPromises)

      this.mergedUsers.forEach(user => {
        const expectedRepos = githubReposForLevel(user.stats.level)
        expect(userRepos[user.id]).to.deep.equal(expectedRepos)

        const expectedApps = herokuAppsForLevel(user.stats.level)
        expect(userApps[user.id]).to.deep.equal(expectedApps)
      })
    })
  })
})
