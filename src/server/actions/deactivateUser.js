import config from 'src/config'
import getUser from 'src/server/actions/getUser'
import {removeUserFromOrganizations} from 'src/server/services/gitHubService'
import {removeCollaboratorFromApps} from 'src/server/services/herokuService'
import {deactivateUser as deactivateChatUser} from 'src/server/services/chatService'
import {deactivateUser as deactivateIDMUser} from 'src/server/services/idmService'
import {logRejection} from 'src/server/util'

const githubOrgs = config.server.github.organizations
const losPermissions = (config.losPermissions || {})

export default async function deactivateUser(userId) {
  const user = await getUser(userId)
  const memberHerokuApps = (losPermissions.heroku || {}).apps || []
  await logRejection(removeUserFromOrganizations(user.handle, githubOrgs), 'Error while removing user from GitHub organizations.')
  await logRejection(removeCollaboratorFromApps(user, memberHerokuApps), 'Error while removing user from Heroku apps.')
  await logRejection(deactivateChatUser(userId), 'Error while deactivating user in the chat system.')

  return deactivateIDMUser(userId)
}
