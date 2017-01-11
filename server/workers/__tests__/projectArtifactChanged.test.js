/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

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
        this.project = await factory.create('project', {
          artifactURL: 'https://example.com',
          name: 'curious-cats',
        })
      })

      it('sends a message to the chapter chatroom', async function () {
        await processProjectArtifactChanged(this.project)

        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.project.name, `[artifact](${this.project.artifactURL})`)

        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.project.name, `#${this.project.name} has been updated`)
      })
    })
  })
})
