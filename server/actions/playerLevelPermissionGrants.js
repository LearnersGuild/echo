import config from 'src/config'

import {flatten} from 'src/common/util'

import {
  getCollaboratorsForRepo,
  addCollaboratorToRepo,
} from 'src/server/services/gitHubService'
import {
  getCollaboratorsForApp,
  addCollaboratorToApp,
} from 'src/server/services/herokuService'

export async function getAPIGrantPromises(users, repos, apps) {
  const ghPromises = await _getGithubAPIGrantPromises(repos, users)
  const hkuPromises = await _getHerokuAPIGrantPromises(apps, users)
  return ghPromises.concat(hkuPromises)
}

export function githubReposForLevel(level) {
  return ((config.levels.permissions[level] || {}).github || {}).repositories || []
}

export function herokuAppsForLevel(level) {
  return ((config.levels.permissions[level] || {}).heroku || {}).apps || []
}

async function _getGithubAPIGrantPromises(repos, users) {
  // awkward: mapped function returns a promise of ... an array of promises
  return flatten(await Promise.all(
    repos.map(ownerAndRepo => _getGithubAPIGrantPromisesForRepo(ownerAndRepo, users))
  ))
}

async function _getGithubAPIGrantPromisesForRepo(ownerAndRepo, users) {
  const [owner, repo] = ownerAndRepo.split('/')
  const collaboratorHandles = (await getCollaboratorsForRepo(owner, repo)).map(_ => _.login)
  const userIsNotCollaborator = user => !collaboratorHandles.includes(user.handle)
  return users
    .filter(userIsNotCollaborator)
    .map(user => addCollaboratorToRepo(user.handle, owner, repo))
}

async function _getHerokuAPIGrantPromises(apps, users) {
  // awkward: mapped function returns a promise of ... an array of promises
  return flatten(await Promise.all(
    apps.map(app => _getHerokuAPIGrantPromisesForApp(app, users))
  ))
}

async function _getHerokuAPIGrantPromisesForApp(app, users) {
  const collaboratorEmails = (await getCollaboratorsForApp(app)).map(_ => _.user.email)
  const userIsNotCollaborator = user => !collaboratorEmails.includes(user.email)
  return users
    .filter(userIsNotCollaborator)
    .map(user => addCollaboratorToApp(user.email, app))
}
