/* eslint-disable import/imports-first */
import parseArgs from 'minimist'

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const {connect} = require('src/db')
const {STAT_DESCRIPTORS} = require('src/common/models/stat')
const getPlayerInfo = require('src/server/actions/getPlayerInfo')
const {buildProjects} = require('src/server/actions/formProjects')
const {finish} = require('./util')

const {ELO} = STAT_DESCRIPTORS

const LOG_PREFIX = `[${__filename.split('js')[0]}]`

const r = connect()

const startedAt = new Date()
console.log('startedAt:', startedAt)
run()
  .then(() => finish(null, {startedAt}))
  .catch(err => finish(err, {startedAt}))

async function run() {
  const {CHAPTER_NAME, CYCLE_NUMBER} = _parseCLIArgs(process.argv.slice(2))

  console.log(LOG_PREFIX, `Arranging projects for cyle ${CYCLE_NUMBER}`)

  const chapters = await r.table('chapters').filter({name: CHAPTER_NAME})
  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name ${CHAPTER_NAME}`)
  }

  const cycles = await r.table('cycles').filter({chapterId: chapter.id, cycleNumber: CYCLE_NUMBER})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${CYCLE_NUMBER} for chapter ${CHAPTER_NAME}`)
  }

  const previewProjects = await buildProjects(cycle.id)
  const {projects, players} = await _expandProjectData(previewProjects)

  console.log('\n\n::: PROJECTS BY TEAM :::\n')
  _logProjectsByTeam(projects)

  console.log('\n\n::: PROJECTS BY PLAYER :::\n')
  _logProjectsByPlayer(players)

  console.log(`TOTAL PLAYERS VOTED: ${players.length}`)
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  if (args._.length !== 2) {
    throw new Error('Usage: npm run preview:projects -- CHAPTER_NAME CYCLE_NUMBER')
  }
  const [CHAPTER_NAME, CYCLE_NUMBER] = args._
  return {CHAPTER_NAME, CYCLE_NUMBER}
}

async function _expandProjectData(projects) {
  const allPlayers = new Map()
  const allProjects = await Promise.all(projects.map(async project => {
    const players = await Promise.all(project.playerIds.map(async playerId => {
      const [users, player] = await Promise.all([
        getPlayerInfo([playerId]),
        r.table('players').get(playerId),
      ])

      const mergedUser = {
        ...users[0],
        ...player,
        [ELO]: ((player.stats || {})[ELO] || {}).rating || 0,
      }

      const playerProject = allPlayers.get(player.id) || {...mergedUser, projects: []}
      playerProject.projects.push(project)
      allPlayers.set(player.id, playerProject)

      return mergedUser
    }))

    return {...project, players}
  }))

  return {projects: allProjects, players: Array.from(allPlayers.values())}
}

function _logProjectsByTeam(projects) {
  projects.forEach(project => {
    console.log(`#${project.name} (${project.goal.title})`)
    console.log('----------')
    project.players.forEach(player => console.log(`@${player.handle} (${player.name}) (${player[ELO]})`))
    console.log('')
  })
}

function _logProjectsByPlayer(players) {
  players.forEach(player => {
    console.log(`@${player.handle} (${player.name}) (${player[ELO]})`)
    console.log('----------')
    player.projects.forEach(project => {
      console.log(`#${project.name} (${project.goal.title})`)
    })
    console.log('')
  })
}
