/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import sinon from 'sinon'

import factory from 'src/test/factories'
import {Player} from 'src/server/services/dataService'
import {withDBCleanup, mockIdmUsersById} from 'src/test/helpers'
import {
  handleProjectCreated,
} from 'src/server/workers/projectCreated'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('handleProjectCreated()', function () {
    beforeEach('create stubs', async function () {
      this.chatClientStub = {
        createChannel: sinon.spy()
      }

      this.project = await factory.create('project')
      this.users = await Player.getAll(...this.project.playerIds)
      this.idmUsers = await mockIdmUsersById(this.project.playerIds)
    })

    it('sends a message to the project chatroom', async function () {
      const event = {projectId: this.project.id}
      const projectName = this.project.name
      const usersHandles = this.idmUsers.map(_ => _.handle)

      await handleProjectCreated(event, {chatClient: this.chatClientStub})

      expect(this.chatClientStub.createChannel).to.have.been.calledWith(projectName, [...usersHandles, 'echo'])
    })
  })
})
