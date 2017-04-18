
/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {PROJECT_STATES} from 'src/common/models/project'

import importProject from '../importProject'

describe(testContext(__filename), function () {
  before(truncateDBTables)
  before(async function () {
    this.chapter = await factory.create('chapter')
    this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, state: GOAL_SELECTION})
    this.coach = await factory.create('player', {chapterId: this.chapter.id})
    this.players = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
    this.users = [this.coach, ...this.players].map(_idmPropsForUser)
    this.goalNumber = 1
    this.importData = {
      chapterIdentifier: this.chapter.name,
      cycleIdentifier: this.cycle.cycleNumber,
      playerIdentifiers: this.players.map(p => p.id),
      coachIdentifier: this.coach.handle,
      goalIdentifier: this.goalNumber,
    }
  })
  beforeEach(function () {
    useFixture.nockClean()
  })

  describe('importProject()', function () {
    it('throws an error if chapterIdentifier is invalid', function () {
      useFixture.nockIDMFindUsers(this.users)
      useFixture.nockGetGoalInfo(this.goalNumber)
      const result = importProject({...this.importData, chapterIdentifier: 'fake.chapter.id'})
      return expect(result).to.eventually.be.rejectedWith(/Chapter not found/)
    })

    it('throws an error if cycleIdentifier is invalid', function () {
      useFixture.nockIDMFindUsers(this.users)
      useFixture.nockGetGoalInfo(this.goalNumber)
      const result = importProject({...this.importData, cycleIdentifier: 10101010})
      return expect(result).to.eventually.be.rejectedWith(/Cycle not found/)
    })

    it('throws an error if player identifiers list is invalid when importing a new project', function () {
      useFixture.nockIDMFindUsers(this.users)
      useFixture.nockGetGoalInfo(this.goalNumber)
      const result = importProject({...this.importData, playerIdentifiers: undefined})
      return expect(result).to.eventually.be.rejectedWith(/must specify at least one user/)
    })

    it('throws an error if the project is no longer IN_PROGRESS', async function () {
      const newProject = await factory.create('project', {
        ...this.importData,
        state: PROJECT_STATES.REVIEW,
      })
      useFixture.nockIDMFindUsers(this.users)
      useFixture.nockGetGoalInfo(this.goalNumber)
      const result = importProject({...this.importData, projectIdentifier: newProject.name})
      return expect(result).to.eventually.be.rejectedWith(/not allowed.*IN_PROGRESS/)
    })

    it('creates a new project a projectIdentifier is not specified', async function () {
      useFixture.nockIDMFindUsers(this.users)
      useFixture.nockGetGoalInfo(this.goalNumber, {times: 3})

      const importedProject = await importProject(this.importData)

      expect(importedProject.goal.goalMetadata.goal_id).to.eq(this.goalNumber) // eslint-disable-line camelcase
      expect(importedProject.chapterId).to.eq(this.chapter.id)
      expect(importedProject.cycleId).to.eq(this.cycle.id)
      expectArraysToContainTheSameElements(importedProject.playerIds, this.players.map(p => p.id))
    })

    it('creates a new project with specified projectIdentifier when existing project not matched', async function () {
      useFixture.nockIDMFindUsers(this.users)
      useFixture.nockGetGoalInfo(this.goalNumber)

      const projectIdentifier = 'new-project'
      const modifiedImportData = Object.assign({}, this.importData, {projectIdentifier})
      const importedProject = await importProject(modifiedImportData)

      expect(importedProject.name).to.eq(modifiedImportData.projectIdentifier)
      expect(importedProject.goal.goalMetadata.goal_id).to.eq(modifiedImportData.goalIdentifier) // eslint-disable-line camelcase
    })

    it('updates goal and users when a valid project identifier is specified', async function () {
      const newProject = await factory.create('project', {chapterId: this.chapter.id, cycleId: this.cycle.id})
      const newPlayers = await factory.createMany('player', {chapterId: this.chapter.id}, 4)
      const newUsers = newPlayers.map(_idmPropsForUser)
      const newGoalNumber = 2

      useFixture.nockIDMFindUsers([this.coach, ...newUsers])
      useFixture.nockGetGoalInfo(newGoalNumber)

      const importedProject = await importProject({
        ...this.importData,
        projectIdentifier: newProject.name,
        playerIdentifiers: newPlayers.map(p => newUsers.find(u => u.id === p.id).handle),
        goalIdentifier: newGoalNumber,
      })

      expect(importedProject.id).to.eq(newProject.id)
      expect(importedProject.chapterId).to.eq(this.chapter.id)
      expect(importedProject.cycleId).to.eq(this.cycle.id)
      expect(importedProject.playerIds.length).to.eq(newPlayers.length)
      expect(importedProject.goal.goalMetadata.goal_id).to.eq(newGoalNumber) // eslint-disable-line camelcase
      expectArraysToContainTheSameElements(importedProject.playerIds, newPlayers.map(p => p.id))
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
