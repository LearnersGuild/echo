/* eslint-disable import/imports-first */
/**
 * Update team members for a collection of projects.
 * Accepts project config in JSON format. Can be used
 * to modify an existing project (referenced by name) or
 * to create a new project (by specifying a valid goal number). If
 * a new project is created, all normal project setup actions will be
 * attempted as well (creating echo channel, posting welcome message, etc).
 */

// FIXME: required by an imported module
global.__SERVER__ = true // eslint-disable import/imports-first

const Promise = require('bluebird')
const parseArgs = require('minimist')

const importProject = require('src/server/actions/importProject')
const {loadJSON} = require('src/server/util')
const {finish} = require('./util')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    INPUT_FILE,
    SKIP_CHANNEL_CREATION,
  } = _parseCLIArgs(process.argv.slice(2))

  const errors = []
  const items = await loadJSON(INPUT_FILE, validateProject)

  console.log(`Importing ${items.length} project team(s)`)

  await Promise.each(items, item => {
    return importProject({
      chapterIdentifier: item.chapterName,
      cycleIdentifier: item.cycleNumber,
      projectIdentifier: item.projectName,
      goalIdentifier: item.goalNumber,
      userIdentifiers: item.playerHandles,
    }, {initializeChannel: !SKIP_CHANNEL_CREATION}).catch(err => {
      errors.push(err)
    })
  })

  if (errors.length > 0) {
    console.error('Errors:\n')
    errors.forEach(err => console.log(err, '\n'))
    throw new Error('Some imports failed')
  }
}

function validateProject(data) {
  const {
    chapterName,
    cycleNumber,
    playerHandles,
    projectName,
    goalNumber,
  } = data || {}

  if (typeof chapterName !== 'string' || chapterName.length === 0) {
    throw new Error('Must specify a valid chapter name')
  }
  if (isNaN(cycleNumber)) {
    throw new Error('Must specify a valid cycle number')
  }
  if ((typeof projectName !== 'string' || projectName === '') && isNaN(goalNumber)) {
    throw new Error('Must specify a project name or goal number')
  }
  if (!Array.isArray(playerHandles) || playerHandles.length === 0) {
    throw new Error('Must specify at least one valid player handle')
  }

  return data
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [INPUT_FILE] = args._
  if (!INPUT_FILE) {
    console.warn('Usage:')
    console.warn('  npm run import:projects -- INPUT_FILE')
    throw new Error('Invalid Arguments')
  }
  return {INPUT_FILE}
}
