import gitHubService from 'src/server/services/gitHubService'
import stubServiceAPIs from './util'

const stubbedAPIs = stubServiceAPIs(gitHubService, {
  getTeam: () => Promise.resolve({}),
  createTeam: () => Promise.resolve({}),
  addUserToTeam: () => Promise.resolve({}),
  addCollaboratorToRepo: () => Promise.resolve({}),
  getCollaboratorsForRepo: () => Promise.resolve([]),
  removeUserFromOrganization: () => Promise.resolve(true),
  removeUserFromOrganizations: () => Promise.resolve([]),
})

export default stubbedAPIs
