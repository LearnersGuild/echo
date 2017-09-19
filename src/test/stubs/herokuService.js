import herokuService from 'src/server/services/herokuService'
import stubServiceAPIs from './util'

const stubbedAPIs = stubServiceAPIs(herokuService, {
  addCollaboratorToApp: () => Promise.resolve(true),
  getCollaboratorsForApp: () => Promise.resolve([]),
  removeCollaboratorFromApp: () => Promise.resolve(true),
  removeCollaboratorFromApps: () => Promise.resolve([]),
})

export default stubbedAPIs
