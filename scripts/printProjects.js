/* eslint-disable import/imports-first */
import parseArgs from 'minimist'

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const fs = require('fs')
const {connect} = require('src/db')
const getPlayerInfo = require('src/server/actions/getPlayerInfo')
const {findProjects} = require('src/server/db/project')
const {finish} = require('./util')

const r = connect()

const LOG_PREFIX = `${__filename.split('.js')[0]}`

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    CHAPTER_NAME,
    CYCLE_NUMBER,
    EXPORT,
    OUTFILE
  } = _parseCLIArgs(process.argv.slice(2))

  if (!EXPORT) {
    console.log(LOG_PREFIX, `Retrieving chapter ${CHAPTER_NAME} cyle ${CYCLE_NUMBER} project teams`)
  }

  const chapters = await r.table('chapters').filter({name: CHAPTER_NAME})
  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name: ${CHAPTER_NAME}`)
  }

  const cycles = await r.table('cycles').filter({chapterId: chapter.id, cycleNumber: CYCLE_NUMBER})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${CYCLE_NUMBER} for chapter ${CHAPTER_NAME}`)
  }

  const projects = await findProjects({chapterId: chapter.id, cycleId: cycle.id})
  const projectsWithPlayers = await Promise.all(projects.map(async (p, index) => {
    return {
      ...projects[index],
      players: await getPlayerInfo(p.playerIds)
    }
  }))

  const sortedProjectsWithPlayers = _sortProjectsByGoalName(projectsWithPlayers)

  if (EXPORT) {
    const output = sortedProjectsWithPlayers.map(project => {
      return {
        chapterId: project.chapterId,
        chapterName: CHAPTER_NAME,
        cycleNumber: CYCLE_NUMBER,
        projectName: project.name,
        playerHandles: project.players.map(player => player.handle)
      }
    })

    fs.writeFileSync(OUTFILE, JSON.stringify(output, null, 4))
  } else {
    console.log('::: PROJECTS BY TEAM :::')
    sortedProjectsWithPlayers.forEach(p => {
      console.log(`\n\n#${p.name}`)
      console.log(`${p.goal.title}`)
      console.log('----------')
      p.players.forEach(pl => console.log(`${pl.handle} (${pl.name})`))
    })
  }
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [CHAPTER_NAME, CYCLE_NUMBER] = args._
  const EXPORT = args.export
  const OUTFILE = args.outfile
  if (!CHAPTER_NAME || !CYCLE_NUMBER || (EXPORT && !OUTFILE)) {
    console.warn('Usage:')
    console.warn('  npm run print:projects -- CHAPTER_NAME CYCLE_NUMBER')
    console.warn('  npm run print:projects -- CHAPTER_NAME CYCLE_NUMBER --export --outfile=tmp/projects.json')
    throw new Error('Invalid Arguments')
  }
  return {
    CHAPTER_NAME,
    CYCLE_NUMBER,
    EXPORT,
    OUTFILE
  }
}

function _sortProjectsByGoalName(projects) {
  return projects.sort((projA, projB) => {
    const {goal: goalA} = projA
    const {goal: goalB} = projB
    return (goalA.title || '').localeCompare(goalB.title || '')
  })
}
