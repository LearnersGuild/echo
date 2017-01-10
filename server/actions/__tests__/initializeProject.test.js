/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {Player} from 'src/server/services/dataService'
import {withDBCleanup, mockIdmUsersById, useFixture} from 'src/test/helpers'

import initializeProject from '../initializeProject'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('initializeProject()', function () {
    beforeEach('setup data & mocks', async function () {
      this.createdChannels = []
      this.sentMessages = []
      useFixture.nockClean()
      useFixture.nockChatLogin({times: 3})
      useFixture.nockChatCreateChannel({
        times: 1,
        onCreateChannel: requestBody => this.createdChannels.push(requestBody),
      })

      this.project = await factory.create('project')
      this.users = await Player.getAll(...this.project.playerIds)
      this.idmUsers = await mockIdmUsersById(this.project.playerIds)
    })

    it('creates the project channel and sends welcome messages', async function () {
      const memberHandles = this.idmUsers.map(u => u.handle).concat(['echo']).sort()

      await initializeProject(this.project)

      const createdChannel = this.createdChannels[0]
      expect(createdChannel.name).to.eq(this.project.name)
      expect(createdChannel.members.sort()).to.deep.eq(memberHandles)
    })
  })
})
