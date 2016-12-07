/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
import {GOAL_SELECTION} from 'src/common/models/cycle'

import importProject from '../importProject'

describe(testContext(__filename), function () {
  before(truncateDBTables)
  before(async function () {
    this.chapter = await factory.create('chapter')
    this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, state: GOAL_SELECTION})
    this.players = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
    this.goalNumber = 1
    this.users = this.players.map(player => ({
      id: player.id,
      active: true,
      handle: `handle_${player.id}`,
    }))
    this.importData = {
      chapterIdentifier: this.chapter.name,
      cycleIdentifier: this.cycle.cycleNumber,
      userIdentifiers: this.users.map(p => p.handle),
      goalIdentifier: this.goalNumber,
    }
  })

  describe('importProject()', function () {
    it('throws an error if chapterIdentifier is invalid', async function () {
      useFixture.nockIDMfindUsers(this.users)

      let importError
      try {
        await importProject({...this.importData, chapterIdentifier: 'fake.chapter.id'})
      } catch (err) {
        importError = err
      }

      return expect(importError.message).to.match(/Chapter not found/)
    })

    it('throws an error if cycleIdentifier is invalid', async function () {
      useFixture.nockIDMfindUsers(this.users)

      let importError
      try {
        await importProject({...this.importData, cycleIdentifier: 10101010})
      } catch (err) {
        importError = err
      }

      return expect(importError.message).to.match(/Cycle not found/)
    })

    it('throws an error if user identifiers list is invalid when importing a new project', async function () {
      useFixture.nockIDMfindUsers(this.users)
      useFixture.nockfetchGoalInfo(this.importData.goalIdentifier)

      let importError
      try {
        await importProject({...this.importData, userIdentifiers: null})
      } catch (err) {
        importError = err
      }

      return expect(importError.message).to.match(/must specify at least one user/)
    })

    it('creates a new project a projectIdentifier is not specified', async function () {
      useFixture.nockIDMfindUsers(this.users)
      useFixture.nockfetchGoalInfo(this.importData.goalIdentifier)

      const importedProject = await importProject(this.importData)

      expect(importedProject.goal.githubIssue.number).to.eq(this.goalNumber)
      expect(importedProject.chapterId).to.eq(this.chapter.id)
      expect(importedProject.cycleId).to.eq(this.cycle.id)
      expect(importedProject.playerIds.length).to.eq(this.players.length)
      importedProject.playerIds.forEach(playerId => {
        expect(this.players.find(p => p.id === playerId))
      })
    })

    it('updates goal and users when a valid projectIdentifier is specified', async function () {
      const newProject = await factory.create('project', {chapterId: this.chapter.id, cycleId: this.cycle.id})
      const newPlayers = await factory.createMany('player', {chapterId: this.chapter.id}, 4)
      const newGoalNumber = 2

      useFixture.nockClean()
      useFixture.nockIDMfindUsers(newPlayers)
      useFixture.nockfetchGoalInfo(newGoalNumber)

      const importedProject = await importProject({
        ...this.importData,
        projectIdentifier: newProject.name,
        userIdentifiers: newPlayers.map(p => p.id),
        goalIdentifier: newGoalNumber,
      })

      expect(importedProject.id).to.eq(newProject.id)
      expect(importedProject.chapterId).to.eq(this.chapter.id)
      expect(importedProject.cycleId).to.eq(this.cycle.id)
      expect(importedProject.playerIds.length).to.eq(newPlayers.length)
      expect(importedProject.goal.githubIssue.number).to.eq(newGoalNumber)
      importedProject.playerIds.forEach(playerId => {
        expect(newPlayers.find(p => p.id === playerId))
      })
    })
  })
})
