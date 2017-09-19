import config from 'src/config'
import getUser from 'src/server/actions/getUser'
import {removeUserFromOrganizations} from 'src/server/services/gitHubService' // eslint-disable-line import/named
import {removeCollaboratorFromApps} from 'src/server/services/herokuService' // eslint-disable-line import/named
import chatService from 'src/server/services/chatService'
import idmService from 'src/server/services/idmService'

import {logRejection} from 'src/server/util'

// NOTE: We're ignoring import named due to note found in
// 'src/server/services/gitHubService' and
// src/server/services/herokuService

/* TODO: Why does 'src/server/actions/__tests__/deactivateUser.test.js' */ // eslint-disable-line no-warning-comments
// fail when we use deactiveChatUser but pass when we use
// chatService.deactivateUser down below?
// For now, we'll use the passing version

// const deactivateChatUser = chatService.deactivateUser
// console.log(deactivateChatUser === chatService.deactivateUser)

const deactivateIDMUser = idmService.deactivateUser

const githubOrgs = config.server.github.organizations
const losPermissions = (config.losPermissions || {})

export default async function deactivateUser(userId) {
  const user = await getUser(userId)
  const memberHerokuApps = (losPermissions.heroku || {}).apps || []
  await logRejection(removeUserFromOrganizations(user.handle, githubOrgs), 'Error while removing user from GitHub organizations.')
  await logRejection(removeCollaboratorFromApps(user, memberHerokuApps), 'Error while removing user from Heroku apps.')
  await logRejection(chatService.deactivateUser(userId), 'Error while deactivating user in the chat system.')

  return deactivateIDMUser(userId)
}
