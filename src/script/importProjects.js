/**
 * Update team members for a collection of projects.
 * Accepts project config in JSON format. Can be used
 * to modify an existing project (referenced by name) or
 * to create a new project (by specifying a valid goal number). If
 * a new project is created, all normal project setup actions will be
 * attempted as well (creating echo channel, posting welcome message, etc).
 */
import Promise from 'bluebird'
import parseArgs from 'minimist'

import importProject from 'src/server/actions/importProject'
import {loadJSON} from 'src/server/util'
import finish from './util'

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    INPUT_FILE,
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
      memberIdentifiers: item.memberHandles,
    }).catch(err => {
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
    memberHandles,
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
  if (!Array.isArray(memberHandles) || memberHandles.length === 0) {
    throw new Error('Must specify at least one valid member handle')
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
