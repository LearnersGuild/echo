import idmService from 'src/server/services/idmService'
import stubServiceAPIs from './util'

const stubbedAPIs = stubServiceAPIs(idmService, {
  deactivateUser: () => Promise.resolve({}),
  findUsers: () => Promise.resolve([]),
  getUser: () => Promise.resolve({}),
  getUsersByHandles: () => Promise.resolve([]),
  getUsersByIds: () => Promise.resolve([]),
})

export default stubbedAPIs
