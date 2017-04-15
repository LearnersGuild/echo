/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {useFixture, withDBCleanup} from 'src/test/helpers'
import stubs from 'src/test/stubs'
import getUser from 'src/server/actions/getUser'
import deactivateUser from 'src/server/actions/deactivateUser'

import nock from 'nock'
import config from 'src/config'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(async function () {
    this.user = await factory.build('user')
    this.player = await factory.create('player', {id: this.user.id, stats: {level: 4}})
    useFixture.nockClean()
    this.nockIDMDeactivateUser = () => {
      nock(config.server.idm.baseURL)
        .persist()
        .intercept('/graphql', 'POST')
        .reply(200, () => ({
          data: {
            deactivateUser: {
              id: this.user.id,
              active: false,
              handle: this.user.handle,
            },
          },
        }))
    }
    stubs.herokuService.enableOne('removeCollaboratorFromApps')
    stubs.gitHubService.enableOne('removeUserFromOrganizations')
    stubs.chatService.enableOne('deactivateUser')
  })

  afterEach(function () {
    stubs.herokuService.disableOne('removeCollaboratorFromApps')
    stubs.gitHubService.disableOne('removeUserFromOrganizations')
    stubs.chatService.disableOne('deactivateUser')
  })

  it('calls heroku, github, and slack and deactivates the user in idm', async function () {
    const gitHubService = require('src/server/services/gitHubService')
    const herokuService = require('src/server/services/herokuService')
    const chatService = require('src/server/services/chatService')

    useFixture.nockIDMGetUser(this.user)
    const userWithStats = await getUser(this.user.id)

    useFixture.nockIDMGetUser(this.user)
    this.nockIDMDeactivateUser()
    const result = await deactivateUser(this.user.id)

    expect(gitHubService.removeUserFromOrganizations).to.have.been.calledWith(this.user.handle, config.server.github.organizations)
    expect(herokuService.removeCollaboratorFromApps).to.have.been.calledWith(userWithStats, config.levels.permissions[userWithStats.stats.level].heroku.apps)
    expect(chatService.deactivateUser).to.have.been.calledWith(this.user.id)
    expect(result.active).to.eql(false)
  })
})
