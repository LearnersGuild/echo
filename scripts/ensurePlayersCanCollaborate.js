/* eslint-disable xo/no-process-exit */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const config = require('src/config')
const {flatten} = require('src/common/util')

const {Player} = require('src/server/services/dataService')
const findUsers = require('src/server/actions/findUsers')

const {
  githubReposForLevel,
  herokuAppsForLevel,
  getAPIGrantPromises,
} = require('src/server/actions/playerLevelPermissionGrants')

const {finish} = require('./util')

async function ensurePlayersCanCollaborate() {
  const permissions = config.levels.permissions
  const levels = Object.keys(permissions).map(levelStr => parseInt(levelStr, 10))

  const getPromisesForLevels = async level => {
    const players = await Player.filter(player => player('stats')('level').eq(level))
    const users = await findUsers(players.map(player => player.id))

    const promises = await getAPIGrantPromises(users, githubReposForLevel(level), herokuAppsForLevel(level))
    console.info(`Setting up collaboration for level ${level} players ...`)
    return promises
  }

  const levelPromises = levels.map(level => getPromisesForLevels(level))
  const nestedArrayOfPromises = await Promise.all(levelPromises)
  await Promise.all(flatten(nestedArrayOfPromises))
}

if (!module.parent) {
  ensurePlayersCanCollaborate()
    .then(() => finish())
    .catch(finish)
}
