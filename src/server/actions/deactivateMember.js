import config from 'src/config'
import getMemberUser from 'src/server/actions/getMemberUser'
import deactivateIDMUser from 'src/server/actions/deactivateIDMUser'
import {removeUserFromOrganizations} from 'src/server/services/gitHubService'
import {deactivateUser as deactivateChatUser} from 'src/server/services/chatService'
import {logRejection} from 'src/server/util'

const githubOrgs = config.server.github.organizations

export default async function deactivateMember(userId) {
  const memberUser = await getMemberUser(userId)
  await logRejection(removeUserFromOrganizations(memberUser.handle, githubOrgs), 'Error while removing user from GitHub organizations.')
  await logRejection(deactivateChatUser(userId), 'Error while deactivating user in the chat system.')
  return deactivateIDMUser(userId)
}
