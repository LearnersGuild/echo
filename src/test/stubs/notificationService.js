import notificationService from 'src/server/services/notificationService'
import stubServiceAPIs from './util'

const stubbedAPIs = stubServiceAPIs(notificationService, {
  notify: () => Promise.resolve({}),
  notifyUser: () => Promise.resolve({}),
})

export default stubbedAPIs
