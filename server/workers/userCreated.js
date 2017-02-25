import config from 'src/config'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {connect} from 'src/db'
import {replace as replacePlayer} from 'src/server/db/player'
import {replace as replaceModerator} from 'src/server/db/moderator'
import {addUserToTeam} from 'src/server/services/gitHub'

const r = connect()

const DEFAULT_PLAYER_STATS = {stats: {[STAT_DESCRIPTORS.ELO]: {rating: 1000}}}

const upsertToDatabase = {
  // we use .replace() instead of .insert() in case we get duplicates in the queue
  moderator: gameUser => replaceModerator(gameUser, {returnChanges: 'always'}),
  player: gameUser => replacePlayer({...gameUser, ...DEFAULT_PLAYER_STATS}, {returnChanges: 'always'}),
}

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userCreated', processUserCreated)
}

async function processUserCreated(user) {
  const gameUser = await addUserToDatabase(user)
  await addUserToChapterGitHubTeam(user, gameUser)
  await notifyCRMSystemOfPlayerSignUp(user)
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
      dbInsertPromises.push(upsertToDatabase[role](gameUser))
    }
  })
  const upsertedUsers = await Promise.all(dbInsertPromises)
    .then(results => results.map(result => result.changes[0].new_val))
    .catch(err => {
      throw new Error(`Unable to insert game user(s): ${err}`)
    })
  return upsertedUsers[0]
}

async function addUserToChapterGitHubTeam(user, gameUser) {
  const chapter = await r.table('chapters').get(gameUser.chapterId).run()
  console.log(`Adding ${user.handle} to GitHub team ${chapter.channelName} (${chapter.githubTeamId})`)

  return addUserToTeam(user.handle, chapter.githubTeamId)
}

function notifyCRMSystemOfPlayerSignUp(user) {
  const crmService = require('src/server/services/crmService')

  if (config.server.crm.enabled !== true) {
    return Promise.resolve()
  }
  if (!_userHasRole(user, 'player')) {
    return Promise.resolve()
  }

  return crmService.notifyContactSignedUp(user.email)
}

function _userHasRole(user, role) {
  if (!user.roles || !Array.isArray(user.roles)) {
    return false
  }
  return user.roles.indexOf(role) >= 0
}
