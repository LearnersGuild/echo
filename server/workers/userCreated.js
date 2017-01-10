import fetch from 'isomorphic-fetch'

import config from 'src/config'
import {connect} from 'src/db'
import {replace as replacePlayer} from 'src/server/db/player'
import {replace as replaceModerator} from 'src/server/db/moderator'

const r = connect()

const DEFAULT_PLAYER_STATS = {stats: {elo: {rating: 1000}}}

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
  await addUserToGitHubChapterTeam(user, gameUser)
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

async function addUserToGitHubChapterTeam(user, gameUser) {
  const chapter = await r.table('chapters').get(gameUser.chapterId).run()
  const fetchOpts = {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.server.github.tokens.admin}`,
      Accept: 'application/json',
    },
  }
  console.log(`Adding ${user.handle} to GitHub team ${chapter.channelName} (${chapter.githubTeamId})`)
  const addToTeamURL = `https://api.github.com/teams/${chapter.githubTeamId}/memberships/${user.handle}`
  return fetch(addToTeamURL, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        const respBody = resp.body.read()
        const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${addToTeamURL}`
        console.error(errMessage)
        throw new Error(`${errMessage}\n${resp.statusText}`)
      }
      return resp.json()
    })
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
