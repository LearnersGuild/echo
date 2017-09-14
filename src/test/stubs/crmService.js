import crmService from 'src/server/services/crmService'
import stubServiceAPIs from './util'

const stubbedAPIs = stubServiceAPIs(crmService, {
  getContactByEmail: () => Promise.resolve({}),
  notifyContactSignedUp: () => Promise.resolve(true),
})

export default stubbedAPIs
