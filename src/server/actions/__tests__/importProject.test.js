
/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'

import importProject from '../importProject'

describe(testContext(__filename), function () {
  before(resetDB)

  before(async function () {
    this.chapter = await factory.create('chapter')
    this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
    this.phase = await factory.create('phase', {number: 1})
    this.members = await factory.createMany('member', {chapterId: this.chapter.id, phaseId: this.phase.id}, 3)
    this.users = this.members.map(_idmPropsForUser)
    this.importData = {
      chapterIdentifier: this.chapter.name,
      cycleIdentifier: this.cycle.cycleNumber,
      memberIdentifiers: this.members.map(p => p.id),
    }
  })

  beforeEach(function () {
    useFixture.nockClean()
    useFixture.nockIDMFindUsers(this.users)
  })

  describe('importProject()', function () {
    it('throws an error if chapterIdentifier is invalid', function () {
      const result = importProject({...this.importData, chapterIdentifier: 'fake.chapter.id'})
      return expect(result).to.eventually.be.rejectedWith(/Chapter not found/)
    })

    it('throws an error if cycleIdentifier is invalid', function () {
      const result = importProject({...this.importData, cycleIdentifier: 10101010})
      return expect(result).to.eventually.be.rejectedWith(/Cycle not found/)
    })

    it('throws an error if member identifiers list is not an array when importing a new project', function () {
      const result = importProject({...this.importData, memberIdentifiers: undefined})
      return expect(result).to.eventually.be.rejectedWith(/Must specify at least one project member/)
    })

    it('throws an error if a specified member is not in a phase', async function () {
      const noPhaseMember = await factory.create('member', {phaseId: null})
      const memberIdentifiers = [...this.importData.memberIdentifiers, noPhaseMember.id]

      useFixture.nockClean()
      useFixture.nockIDMFindUsers([...this.users, noPhaseMember])

      const result = importProject({...this.importData, memberIdentifiers})
      return expect(result).to.eventually.be.rejectedWith(/All project members must be in a phase/)
    })

    it('throws an error if specified members are not in the same phase', async function () {
      const newPhase = await factory.create('phase')
      const noPhaseMember = await factory.create('member', {phaseId: newPhase.id})
      const memberIdentifiers = [...this.importData.memberIdentifiers, noPhaseMember.id]

      useFixture.nockClean()
      useFixture.nockIDMFindUsers([...this.users, noPhaseMember])

      const result = importProject({...this.importData, memberIdentifiers})
      return expect(result).to.eventually.be.rejectedWith(/Project members must be in the same phase/)
    })

    it('creates a new project a projectIdentifier is not specified', async function () {
      useFixture.nockClean()
      useFixture.nockIDMFindUsers(this.users)

      const importedProject = await importProject(this.importData)

      expect(importedProject.chapterId).to.eq(this.chapter.id)
      expect(importedProject.cycleId).to.eq(this.cycle.id)
      expectArraysToContainTheSameElements(importedProject.memberIds, this.members.map(p => p.id))
    })

    it('creates a new project with specified projectIdentifier as the name when an existing project is not matched', async function () {
      const projectIdentifier = 'new-project'
      const modifiedImportData = Object.assign({}, this.importData, {projectIdentifier})
      const importedProject = await importProject(modifiedImportData)

      expect(importedProject.name).to.eq(modifiedImportData.projectIdentifier)
    })

    it('updates users when a valid project identifier is specified', async function () {
      const newProject = await factory.create('project', {chapterId: this.chapter.id, cycleId: this.cycle.id, phaseId: this.phase.id})
      const newMembers = await factory.createMany('member', {chapterId: this.chapter.id, phaseId: this.phase.id}, 4)
      const newUsers = newMembers.map(_idmPropsForUser)

      useFixture.nockClean()
      useFixture.nockIDMFindUsers(newUsers)

      const importedProject = await importProject({
        ...this.importData,
        projectIdentifier: newProject.name,
        memberIdentifiers: newMembers.map(p => newUsers.find(u => u.id === p.id).handle),
      })

      expect(importedProject.id).to.eq(newProject.id)
      expect(importedProject.chapterId).to.eq(this.chapter.id)
      expect(importedProject.cycleId).to.eq(this.cycle.id)
      expect(importedProject.memberIds.length).to.eq(newMembers.length)
      expectArraysToContainTheSameElements(importedProject.memberIds, newMembers.map(p => p.id))
    })
  })
})

function _idmPropsForUser(user) {
  return {
    id: user.id,
    active: true,
    handle: `handle_${user.id}`,
  }
}
