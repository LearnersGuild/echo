/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'

import {getCommand} from 'src/server/cliCommand/util'

import {concatResults} from './helpers'

describe(testContext(__filename), function () {
  useFixture.ensureNoGlobalWindow()
  useFixture.setCurrentCycleAndMemberForProject()

  beforeEach(resetDB)

  describe('project set-artifact', function () {
    beforeEach(async function () {
      const {commandSpec, commandImpl} = getCommand('project')
      this.commandSpec = commandSpec
      this.commandImpl = commandImpl
      this.project = await factory.create('project')
      this.url = 'http://example.com/owner/repo'
    })

    it('returns a "Thanks" message on success with a project name', async function () {
      await this.setCurrentCycleAndMemberForProject(this.project)

      const args = this.commandSpec.parse(['set-artifact', this.project.name, this.url])
      const result = await this.commandImpl.invoke(args, {user: this.currentUser})
      const fullResult = concatResults(result)
      expect(fullResult).to.match(/Thanks/i)
      expect(fullResult).to.contain(this.project.name)
      expect(fullResult).to.contain(this.url)
    })

    it('returns a "Thanks" message on success without a project name', async function () {
      await this.setCurrentCycleAndMemberForProject(this.project)

      const args = this.commandSpec.parse(['set-artifact', this.url])
      const result = await this.commandImpl.invoke(args, {user: this.currentUser})
      const fullResult = concatResults(result)
      expect(fullResult).to.match(/Thanks/i)
      expect(fullResult).to.contain(this.project.name)
      expect(fullResult).to.contain(this.url)
    })

    it('throws an error if the member passes an invalid project name', async function () {
      await this.setCurrentCycleAndMemberForProject(this.project)

      const args = this.commandSpec.parse(['set-artifact', 'invalid-name', this.url])
      expect(this.commandImpl.invoke(args, {user: this.currentUser})).to.eventually.throw(/No such project/i)
    })

    it('throws an error if the member does not pass a project name and is not on exactly 1 active project', async function () {
      await this.setCurrentCycleAndMemberForProject(this.project)
      await factory.create('project', {chapterId: this.project.chapterId, cycleId: this.project.cycleId, memberIds: [this.member.id]})

      const args = this.commandSpec.parse(['set-artifact', this.url])
      expect(this.commandImpl.invoke(args, {user: this.currentUser})).to.eventually.throw(/Must specify a valid project name/i)
    })

    it('throws an error if the member did not work on the given project', async function () {
      await this.setCurrentCycleAndMemberForProject(this.project)
      const inactiveMember = await factory.create('member', {chapterId: this.project.chapterId})
      const currentUser = await factory.build('user', {id: inactiveMember.id, roles: ['member']})

      const args = this.commandSpec.parse(['set-artifact', 'invalid-name', this.url])
      expect(this.commandImpl.invoke(args, {user: currentUser})).to.eventually.throw(/No such project.*that name.*that member/i)
    })
  })
})
