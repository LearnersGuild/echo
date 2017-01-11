import {stub} from 'sinon'

import notificationService from 'src/server/services/notificationService'

export default {
  enable() {
    stub(notificationService, 'notify', () => {})
    stub(notificationService, 'notifyUser', () => {})
  },

  disable() {
    notificationService.notify.restore()
    notificationService.notifyUser.restore()
  },
}
