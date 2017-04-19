import config from 'src/config'
import {connect} from 'src/db'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {STAT_DESCRIPTORS, PRO_PLAYER_STATS_BASELINE} from 'src/common/models/stat'
import {addUserToTeam} from 'src/server/services/gitHubService'
import {logRejection} from 'src/server/util'

import {
  Moderator,
  Player,
  PlayerPool,
  getLatestCycleForChapter,
  getPoolsForCycleWithPlayerCount,
} from 'src/server/services/dataService'
import {LEVELS, computePlayerLevel} from 'src/server/util/stats'

const r = connect()

const {
  ELO,
  ESTIMATION_ACCURACY,
  LEVEL,
} = STAT_DESCRIPTORS

// we want new players to start on level 1, but not act as
// if they have a higher estimation accuracy than current
// level 1 players
const newPlayerEstimationAccuracy = LEVELS[1].requirements[ESTIMATION_ACCURACY] + 0.01
const DEFAULT_PLAYER_STATS = {
  [ELO]: {rating: 1000},
  weightedAverages: {
    [ESTIMATION_ACCURACY]: newPlayerEstimationAccuracy,
  },
}
DEFAULT_PLAYER_STATS[LEVEL] = computePlayerLevel(DEFAULT_PLAYER_STATS)

const upsertToDatabase = {
  // conflict: replace (instead of insert) in case this is a get duplicate in the queue
  // TODO: consider throwing an error instead of replacing
  moderator: gameUser => Moderator.save(gameUser, {conflict: 'replace'}),
  player: (gameUser, idmUser) => {
    const statsBaseline = _userHasRole(idmUser, 'sep') ? PRO_PLAYER_STATS_BASELINE : {}
    return Player.save({
      ...gameUser,
      stats: {
        ...DEFAULT_PLAYER_STATS,
        ...statsBaseline,
      },
      statsBaseline,
    }, {conflict: 'replace'})
  },
}

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userCreated', processUserCreated)
}

export async function processUserCreated(user) {
  const gameUser = await addUserToDatabase(user)
  await addUserToChapterGitHubTeam(user, gameUser)
  await notifyCRMSystemOfPlayerSignUp(user)

  const cycle = await getLatestCycleForChapter(gameUser.chapterId)
  if (cycle.state === GOAL_SELECTION) {
    await addNewPlayerToPool(gameUser, cycle)
  }
}

async function addNewPlayerToPool(gameUser, cycle) {
  const poolsWithCount = await getPoolsForCycleWithPlayerCount(cycle.id)
    .filter(_ => _('levels').contains(gameUser.stats.level))

  poolsWithCount.sort((previousPool, currentPool) => previousPool.count - currentPool.count)
  await PlayerPool.save({playerId: gameUser.id, poolId: poolsWithCount[0].id})
}

async function addUserToDatabase(user) {
  if (!user.inviteCode) {
    throw new Error(`user with id ${user.id} has no inviteCode, unable to determine chapter assignment`)
  }
  const chapters = await r.table('chapters').getAll(user.inviteCode, {index: 'inviteCodes'}).run()
  if (chapters.length === 0) {
    throw new Error(`no chapter found for inviteCode ${user.inviteCode} on user with id ${user.id}`)
  }
  const chapter = chapters[0]
  const now = r.now()
  const gameUser = {
    id: user.id,
    chapterId: chapter.id,
    createdAt: now,
    updatedAt: now,
  }
  const gameRoles = ['player', 'moderator']
  const dbInsertPromises = []
  gameRoles.forEach(role => {
    if (_userHasRole(user, role)) {
      dbInsertPromises.push(upsertToDatabase[role](gameUser, user))
    }
  })
  const upsertedUsers = await Promise.all(dbInsertPromises)
    .catch(err => {
      throw new Error(`Unable to insert game user(s): ${err}`)
    })
  return upsertedUsers[0]
}

async function addUserToChapterGitHubTeam(user, gameUser) {
  const chapter = await r.table('chapters').get(gameUser.chapterId).run()
  console.log(`Adding ${user.handle} to GitHub team ${chapter.channelName} (${chapter.githubTeamId})`)

  return logRejection(addUserToTeam(user.handle, chapter.githubTeamId), 'Error while adding user to chapter GitHub team.')
}

function notifyCRMSystemOfPlayerSignUp(user) {
  const crmService = require('src/server/services/crmService')

  if (config.server.crm.enabled !== true) {
    return Promise.resolve()
  }
  if (!_userHasRole(user, 'player')) {
    return Promise.resolve()
  }

  return logRejection(crmService.notifyContactSignedUp(user.email), 'Error while contacting CRM System.')
}

function _userHasRole(user, role) {
  if (!user.roles || !Array.isArray(user.roles)) {
    return false
  }
  return user.roles.indexOf(role) >= 0
}
