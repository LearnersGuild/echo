/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const updatePlayerStatsForProject = require('src/server/actions/updatePlayerStatsForProject')
const updateProjectStats = require('src/server/actions/updateProjectStats')
const {connect} = require('src/db')
const {findChapters} = require('src/server/db/chapter')
const {getCyclesForChapter} = require('src/server/db/cycle')
const {Player, Project} = require('src/server/services/dataService')
const {COMPLETE} = require('src/common/models/cycle')
const {finish} = require('./util')

const r = connect()

const LOG_PREFIX = '[runStats]'

// FIXME: hardcoded, yuck
const PRO_PLAYERS = {
  '070b3063-0ff7-40c6-b3d1-321fa49b6c94': {handle: 'bluemihai', initialXp: 0},
  'dcf14075-6fbe-44ab-89bf-cba2511f0278': {handle: 'deadlyicon', initialXp: 0},
  'ed958f6f-1870-4ba9-8de9-e1092c9fa758': {handle: 'deonna', initialXp: 1001},
  '75dbe257-a701-4725-ba74-4341376f540d': {handle: 'jrob8577', initialXp: 0},
  '1707c1b3-1be7-49ce-b0bd-ab9f289a4795': {handle: 'punitrathore', initialXp: 1001},
  '51430799-d153-4866-adc0-612e0b879bbe': {handle: 'bundacia', initialXp: 1001},
  '3a1599ac-2105-4806-95d7-1bcd3d6a2da7': {handle: 'jeffreywescott', initialXp: 1001},
  '3760fbe8-2c2e-46d9-bca7-a9610dc0d417': {handle: 'prattsj', initialXp: 1001},
  'f490c8ee-e609-4774-bcf5-9ed7f938676d': {handle: 'tannerwelsh', initialXp: 1001},
}

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []

  // clear player & project stats
  await Player.replace(row => row.without('stats'))
  await Project.replace(row => row.without('stats'))

  // initialize special pro player stats
  const proPlayers = await Player.filter(row => r.expr(PRO_PLAYERS)(row('id')))

  await Promise.each(proPlayers, proPlayer => {
    return setPlayerStats(proPlayer, {
      xp: PRO_PLAYERS[proPlayer.id].initialXp,
    })
  })

  // calculate stats for each player in each project in each cycle in each chapter
  const chapters = await findChapters()
  await Promise.each(chapters, chapter => {
    return updateChapterStats(chapter).catch(err => {
      errors.push(err)
    })
  })

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.error('\n', err))
    throw new Error('Stats computation failed')
  }

  // log final player ratings
  const players = await Player.run()

  players
    .map(player => ({
      id: player.id,
      elo: ((player.stats || {}).elo || {}).rating || null
    }))
    .sort((a, b) => a.elo - b.elo)
    .forEach(player => console.log(player.id.slice(0, 8), player.elo))
}

function setPlayerStats(player, stats) {
  console.log(LOG_PREFIX, `Setting stats for player ${player.id}`)

  return Player.get(player.id).update({stats})
}

async function updateChapterStats(chapter) {
  console.log(LOG_PREFIX, `Updating stats for chapter ${chapter.name} (${chapter.id})`)

  const chapterCycles = await getCyclesForChapter(chapter.id)
  const chapterCyclesSorted = chapterCycles.sort((a, b) => a.cycleNumber - b.cycleNumber)

  return Promise.each(chapterCyclesSorted, cycle => {
    if (cycle.state !== COMPLETE) {
      console.log(LOG_PREFIX, `Skipping cycle ${cycle.id} in state ${cycle.state}`)
      return
    }
    return updateChapterCycleStats(chapter, cycle)
  })
}

async function updateChapterCycleStats(chapter, cycle) {
  console.log(LOG_PREFIX, `Updating stats for cycle ${cycle.cycleNumber} (${cycle.id})`)

  const cycleProjects = await Project.filter({chapterId: chapter.id, cycleId: cycle.id})
  return Promise.each(cycleProjects, async project => {
    console.log(LOG_PREFIX, `Updating stats for project ${project.name} (${project.id})`)

    await updatePlayerStatsForProject(project)
    await updateProjectStats(project.id)
  })
}
