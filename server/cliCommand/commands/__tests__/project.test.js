/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'

import {getCommand} from 'src/server/cliCommand/util'

import {concatResults} from './helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.ensureNoGlobalWindow()
  useFixture.setCurrentCycleAndUserForProject()

  describe('project set-artifact', function () {
    beforeEach(async function () {
      const {commandSpec, commandImpl} = getCommand('project')
      this.commandSpec = commandSpec
      this.commandImpl = commandImpl
      this.project = await factory.create('project')
      this.url = 'http://example.com/owner/repo'
    })

    it('returns a "Thanks" message on success', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const args = this.commandSpec.parse(['set-artifact', this.project.name, this.url])
      const result = await this.commandImpl.invoke(args, {user: this.currentUser})
      const fullResult = concatResults(result)
      expect(fullResult).to.match(/Thanks/i)
      expect(fullResult).to.contain(this.project.name)
      expect(fullResult).to.contain(this.url)
    })

    it('throws an error if the player passes an invalid project name', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const args = this.commandSpec.parse(['set-artifact', 'invalid-name', this.url])
      expect(this.commandImpl.invoke(args, {user: this.currentUser})).to.eventually.throw(/No such project/i)
    })

    it('throws an error if the player did not work on the given project', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)
      const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})
      const currentUser = await factory.build('user', {id: inactivePlayer.id, roles: ['player']})

      const args = this.commandSpec.parse(['set-artifact', 'invalid-name', this.url])
      expect(this.commandImpl.invoke(args, {user: currentUser})).to.eventually.throw(/No such project.*that name.*that player/i)
    })
  })
})
