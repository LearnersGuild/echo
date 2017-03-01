import config from 'src/config'

import findUsers from 'src/server/actions/findUsers'
import {Player} from 'src/server/services/dataService'
import {addCollaboratorToRepo} from 'src/server/services/gitHubService'
import {addCollaboratorToApp} from 'src/server/services/herokuService'

export async function grantPermissionsForEachLevel() {
  const permissions = config.levels.permissions

  const apiPromises = []
  for (const levelStr in Object.keys(permissions)) {
    if (Object.hasOwnProperty.call(permissions, levelStr)) {
      const level = parseInt(levelStr, 10)
      const players = await Player.filter(player => player('stats')('level').eq(level))
      const users = await findUsers(players.map(player => player.id))
      apiPromises.push(...getAPIGrantPromises(users))
    }
  }

  await Promise.all(apiPromises)
}

export function githubReposForLevel(level) {
  return ((config.levels.permissions[level] || {}).github || {}).repositories || []
}

export function herokuAppsForLevel(level) {
  return ((config.levels.permissions[level] || {}).heroku || {}).apps || []
}

export function getAPIGrantPromises(mergedUsers) {
  return _getGithubAPIGrantPromises(mergedUsers)
    .concat(_getHerokuAPIGrantPromises(mergedUsers))
}

function _getGithubAPIGrantPromises(mergedUsers) {
  const apiPromises = []
  mergedUsers.forEach(user => {
    if (user.active) {
      const repos = githubReposForLevel(user.stats.level)
      repos.forEach(ownerAndRepo => {
        const [owner, repo] = ownerAndRepo.split('/')
        apiPromises.push(addCollaboratorToRepo(user.handle, owner, repo))
      })
    }
  })

  return apiPromises
}

function _getHerokuAPIGrantPromises(mergedUsers) {
  const apiPromises = []
  mergedUsers.forEach(user => {
    if (user.active) {
      const apps = herokuAppsForLevel(user.stats.level)
      apps.forEach(app => {
        apiPromises.push(addCollaboratorToApp(user.email, app))
      })
    }
  })

  return apiPromises
}
