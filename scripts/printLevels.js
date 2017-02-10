/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const {STAT_DESCRIPTORS} = require('src/common/models/stat')
const getPlayerInfo = require('src/server/actions/getPlayerInfo')
const {findPlayers} = require('src/server/db/player')
const {mapById} = require('src/server/util')
const {finish} = require('./util')

const {LEVEL} = STAT_DESCRIPTORS

const startedAt = new Date()
console.log('startedAt:', startedAt)
run()
  .then(() => finish(null, {startedAt}))
  .catch(err => finish(err, {startedAt}))

async function run() {
  // retrieve all players & user profile info; sort by handle
  let players = await findPlayers()
  const playerUsers = await getPlayerInfo(players.map(p => p.id))
  const playerUserMap = mapById(playerUsers)
  players = players
    .map(p => {
      return {...p, ...(playerUserMap.get(p.id) || {}), [LEVEL]: (p.stats || {})[LEVEL] || 0}
    })
    .filter(p => p.active && p.roles.indexOf('staff') < 0)
    .sort((a, b) => a.handle.localeCompare(b.handle))

  printPlayerLevels(players)
}

async function printPlayerLevels(players) {
  console.log()
  players.forEach(player => {
    console.log(`${player.handle} (${player.name}): ${player[LEVEL]}`)
  })
  console.log()
  console.log('Level Counts\n============')
  for (let i = 0; i <= 4; ++i) {
    const numPlayers = players.reduce((count, player) => {
      if (player[LEVEL] === i) {
        count++
      }
      return count
    }, 0)
    console.log(`Level ${i}:`, numPlayers)
  }
  console.log()
}
