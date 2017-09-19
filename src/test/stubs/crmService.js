import {getContactByEmail, notifyContactSignedUp} from 'src/server/services/crmService'
import stubServiceAPIs from './util'

const crmService = {getContactByEmail, notifyContactSignedUp}

const stubbedAPIs = stubServiceAPIs(crmService, {
  getContactByEmail: () => Promise.resolve({}),
  notifyContactSignedUp: () => Promise.resolve(true),
})

export default stubbedAPIs
