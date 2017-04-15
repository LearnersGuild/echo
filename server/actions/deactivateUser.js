import config from 'src/config'
import getUser from 'src/server/actions/getUser'
import {removeUserFromOrganizations} from 'src/server/services/gitHubService'
import {removeCollaboratorFromApps} from 'src/server/services/herokuService'
import {deactivateUser as deactivateChatUser} from 'src/server/services/chatService'
import graphQLFetcher from 'src/server/util/graphql'

const githubOrgs = config.server.github.organizations
const levelPermissions = (config.levels.permissions || {})

export default async function deactivateUser(userId) {
  const user = await getUser(userId)
  const userLevelPermissions = levelPermissions[user.stats.level] || {}
  const playerHerokuApps = (userLevelPermissions.heroku || {}).apps || []
  _tryAndLog(async () => await removeUserFromOrganizations(user.handle, githubOrgs))
  _tryAndLog(async () => await removeCollaboratorFromApps(user, playerHerokuApps))
  _tryAndLog(async () => await deactivateChatUser(userId))

  const {data: {deactivateUser: updatedUser}} = await _deactivateUserInIDM(userId)

  return updatedUser
}

function _deactivateUserInIDM(userId) {
  const mutation = {
    query: 'mutation ($playerId: ID!) { deactivateUser(id: $playerId) { id active handle } }',
    variables: {playerId: userId},
  }
  return graphQLFetcher(config.server.idm.baseURL)(mutation)
}

function _tryAndLog(promiseFunc) {
  return promiseFunc().catch(err => {
    console.warn('Error while deactivating user:', err.stack || err)
  })
}
