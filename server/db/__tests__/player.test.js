/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import Promise from 'bluebird'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {connect} from 'src/db'
import {range} from 'src/server/util'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  getPlayerById,
  reassignPlayersToChapter,
  savePlayerProjectStats,
} from 'src/server/db/player'

const {
  CULTURE_CONTRIBUTION,
  LEVEL,
  PROJECT_HOURS,
  RELATIVE_CONTRIBUTION,
  RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES,
  RELATIVE_CONTRIBUTION_DELTA,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
  RELATIVE_CONTRIBUTION_EXPECTED,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getPlayerById', function () {
    beforeEach(function () {
      return factory.create('player').then(player => {
        this.player = player
      })
    })

    it('returns a shallow player by default', function () {
      return getPlayerById(this.player.id)
        .then(player => {
          expect(player).to.have.property('chapterId')
          expect(player).to.not.have.property('chapter')
        })
    })

    it('merges in the chapter info when requested', function () {
      return getPlayerById(this.player.id, {mergeChapter: true})
        .then(player => {
          expect(player).to.not.have.property('chapterId')
          expect(player).to.have.property('chapter')
          expect(player.chapter).to.have.property('id')
          expect(player.chapter).to.have.property('name')
        })
    })
  })

  describe('reassignPlayersToChapter()', function () {
    beforeEach(function () {
      return Promise.all([
        factory.createMany('player', 2).then(players => {
          this.players = players
          this.playersById = players.reduce((obj, player) => Object.assign(obj, {[player.id]: player}), {})
        }),
        factory.create('chapter').then(c => {
          this.newChapter = c
        }),
      ])
    })

    it('changes the players chapterId & chapterHistory', function () {
      const playerIds = Object.keys(this.playersById)
      return reassignPlayersToChapter(playerIds, this.newChapter.id)
        .then(() => r.table('players').getAll(...playerIds).run())
        .then(players => {
          players.forEach(player => {
            const oldChapterId = this.playersById[player.id].chapterId
            expect(player.chapterId).to.equal(this.newChapter.id)
            expect(player.chapterHistory).to.have.length(1)
            expect(player.chapterHistory[0].chapterId).to.equal(oldChapterId)
          })
        })
    })

    it('returns the new players', function () {
      const playerIds = this.players.map(p => p.id)
      return reassignPlayersToChapter(playerIds, this.newChapter.id).then(result =>
        r.table('players').getAll(...playerIds).run().then(playersFromDB =>
          expect(result).to.deep.equal(playersFromDB)
        )
      )
    })

    it('ignores players already in the given chapter', function () {
      const playerIds = this.players.map(p => p.id)
      expect(
        reassignPlayersToChapter(playerIds, this.players[0].chapterId)
      ).to.eventually.have.length(1)
    })

    it('resolve promise with empty array when no matches', function () {
      expect(
        reassignPlayersToChapter(['not-a-player-id'], this.newChapter.id)
      ).to.eventually.deep.equal([])
    })
  })

  describe('savePlayerProjectStats', function () {
    beforeEach(async function () {
      this.projectIds = [await r.uuid(), await r.uuid()]
      this.player = await factory.create('player', {stats: {[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 0}})
      this.fetchPlayer = () => getPlayerById(this.player.id)
    })

    it('creates the stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES] attribute if missing', async function () {
      const projectStats = {
        [CULTURE_CONTRIBUTION]: 90,
        [PROJECT_HOURS]: 35,
        [RELATIVE_CONTRIBUTION]: 10,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 40,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 15,
        [TEAM_PLAY]: 83,
        [TECHNICAL_HEALTH]: 80,
      }
      const expectedSavedProjectStats = {...projectStats, [LEVEL]: {starting: 0, ending: 0}}
      await getPlayerById(this.player.id).replace(p => p.without('stats'))
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(40)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: expectedSavedProjectStats,
      })
    })

    it('adds to the existing cumulative stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]', async function () {
      expect(this.player).to.have.deep.property(`stats.${RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES}`)

      const projectStats = {
        [CULTURE_CONTRIBUTION]: 85,
        [PROJECT_HOURS]: 30,
        [RELATIVE_CONTRIBUTION]: 5,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 20,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 10,
        [TEAM_PLAY]: 83,
        [TECHNICAL_HEALTH]: 80,
      }
      const expectedSavedProjectStats = {...projectStats, [LEVEL]: {starting: 0, ending: 0}}
      await getPlayerById(this.player.id).update({stats: {[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 10}})
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(30)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[1]]: expectedSavedProjectStats,
      })
    })

    it('creates the stats.projects attribute if neccessary', async function () {
      expect(this.player).to.not.have.deep.property('stats.projects')

      const projectStats = {
        [PROJECT_HOURS]: 30,
        [CULTURE_CONTRIBUTION]: 85,
        [RELATIVE_CONTRIBUTION]: 5,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 20,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 10,
        [TEAM_PLAY]: 83,
        [TECHNICAL_HEALTH]: 80,
      }
      const expectedSavedProjectStats = {...projectStats, [LEVEL]: {starting: 0, ending: 0}}
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(20)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: expectedSavedProjectStats,
      })
    })

    it('adds a project entry to the stats if neccessary', async function () {
      expect(this.player).to.not.have.deep.property('stats.projects')

      const projectsStats = [{
        [CULTURE_CONTRIBUTION]: 85,
        [PROJECT_HOURS]: 30,
        [RELATIVE_CONTRIBUTION]: 5,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 20,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 10,
        [TEAM_PLAY]: 83,
        [TECHNICAL_HEALTH]: 80,
      }, {
        [CULTURE_CONTRIBUTION]: 95,
        [PROJECT_HOURS]: 40,
        [RELATIVE_CONTRIBUTION]: 6,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 3,
        [RELATIVE_CONTRIBUTION_DELTA]: -14,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 18,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 20,
        [TEAM_PLAY]: 40,
        [TECHNICAL_HEALTH]: 90,
      }]
      const expectedSavedProjectsStats = projectsStats.map(projectStats => ({
        ...projectStats,
        [LEVEL]: {starting: 0, ending: 0},
      }))
      await savePlayerProjectStats(this.player.id, this.projectIds[0], expectedSavedProjectsStats[0])
      await savePlayerProjectStats(this.player.id, this.projectIds[1], expectedSavedProjectsStats[1])

      const player = await this.fetchPlayer()

      expect(player.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(38)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: expectedSavedProjectsStats[0],
        [this.projectIds[1]]: expectedSavedProjectsStats[1],
      })
    })

    it('adds a statsComputedAt timestamp', async function () {
      expect(await this.fetchPlayer()).to.not.have.property('statsComputedAt')

      await savePlayerProjectStats(this.player.id, this.projectIds[0], {[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 10})

      expect(await this.fetchPlayer()).to.have.property('statsComputedAt')
    })

    it('when called for the same project more than once, the result is the same as if only the last call were made', async function () {
      // Initialize the player with an ECC of 10
      const projectStats1 = {
        [CULTURE_CONTRIBUTION]: 85,
        [PROJECT_HOURS]: 30,
        [RELATIVE_CONTRIBUTION]: 5,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 2,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 10,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 10,
        [TEAM_PLAY]: 83,
        [TECHNICAL_HEALTH]: 80,
      }
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats1)

      // Add 20 for a project
      const projectStats2 = {
        [CULTURE_CONTRIBUTION]: 95,
        [PROJECT_HOURS]: 30,
        [RELATIVE_CONTRIBUTION]: 5,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 20,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 10,
        [TEAM_PLAY]: 40,
        [TECHNICAL_HEALTH]: 90,
      }
      const expectedSavedProjectStats2 = {...projectStats2, [LEVEL]: {starting: 0, ending: 0}}
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats2)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.${RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES}`, 30)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.projects.${this.projectIds[1]}`).deep.eq(expectedSavedProjectStats2)

      // Change the ECC for that project to 10
      const projectStats3 = {
        [CULTURE_CONTRIBUTION]: 97,
        [PROJECT_HOURS]: 30,
        [RELATIVE_CONTRIBUTION]: 5,
        [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 2,
        [RELATIVE_CONTRIBUTION_DELTA]: -5,
        [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 10,
        [RELATIVE_CONTRIBUTION_EXPECTED]: 10,
        [TEAM_PLAY]: 65,
        [TECHNICAL_HEALTH]: 95,
      }
      const expectedSavedProjectStats3 = {...projectStats3, [LEVEL]: {starting: 0, ending: 0}}
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats3)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.${RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES}`, 20)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.projects.${this.projectIds[1]}`).deep.eq(expectedSavedProjectStats3)
    })

    it('computes and stores weighted averages of any numbers in stats (last 6 projects)', async function () {
      const chapterId = this.player.chapterId
      const cycleAttrs = range(1, 8).map(cycleNumber => ({cycleNumber, chapterId}))
      const cycles = await factory.createMany('cycle', cycleAttrs)
      const projectAttrs = cycles.map(cycle => ({cycleId: cycle.id, chapterId}))
      const projects = await factory.createMany('project', projectAttrs)

      const projectStats = [
        {a: 2, b: 5, c: 9},
        {a: 3, b: 5, c: 9},
        {a: 4, b: 5, c: 1},
        {a: 5, b: 5, c: 1},
        {a: 6, b: 5, c: 2},
        {a: 7, b: 5, c: 2},
        {a: 8, b: 5, c: 3},
        {a: 9, b: 5, c: 3},
      ]
      await Promise.each(projectStats, (stats, i) => {
        return savePlayerProjectStats(this.player.id, projects[i].id, stats)
      })

      const player = await this.fetchPlayer()

      expect(player.stats.weightedAverages).to.deep.eq({
        a: 6.5, b: 5, c: 2
      })
    })
  })
})
