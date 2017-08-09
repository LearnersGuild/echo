/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import config from 'src/config'
import factory from 'src/test/factories'
import {useFixture, resetDB} from 'src/test/helpers'
import stubs from 'src/test/stubs'

import deactivateMember from '../deactivateMember'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(async function () {
    this.user = await factory.build('user')
    this.member = await factory.create('member', {id: this.user.id})
    useFixture.nockClean()
    useFixture.nockIDMGetUser(this.user)
    useFixture.nockIDMDeactivateUser(this.user)
    stubs.gitHubService.enableOne('removeUserFromOrganizations')
    stubs.chatService.enableOne('deactivateUser')
  })

  afterEach(function () {
    stubs.gitHubService.disableOne('removeUserFromOrganizations')
    stubs.chatService.disableOne('deactivateUser')
  })

  it('calls github, and slack and deactivates the user in idm', async function () {
    const gitHubService = require('src/server/services/gitHubService')
    const chatService = require('src/server/services/chatService')

    const result = await deactivateMember(this.user.id)

    expect(gitHubService.removeUserFromOrganizations).to.have.been.calledWith(this.user.handle, config.server.github.organizations)
    expect(chatService.deactivateUser).to.have.been.calledWith(this.user.id)
    expect(result.active).to.eql(false)
  })
})
