/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processProjectArtifactChanged()', function () {
    const chatService = require('src/server/services/chatService')

    const {processProjectArtifactChanged} = require('../projectArtifactChanged')

    describe('when a cycle has completed', function () {
      beforeEach(async function () {
        this.users = await factory.buildMany('user', 4)
        this.handles = this.users.map(user => user.handle)
        this.project = await factory.create('project', {
          artifactURL: 'https://example.com',
          name: 'curious-cats',
          playerIds: this.users.map(user => user.id)
        })
        useFixture.nockIDMGetUsersById(this.users)
      })

      it('sends a message to the chapter chatroom', async function () {
        await processProjectArtifactChanged(this.project)

        expect(chatService.sendMultiPartyDirectMessage).to.have.been
          .calledWithMatch(this.handles, `[artifact](${this.project.artifactURL})`)

        expect(chatService.sendMultiPartyDirectMessage).to.have.been
          .calledWithMatch(this.handles, `#${this.project.name} has been updated`)
      })
    })
  })
})
