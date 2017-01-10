import {stub} from 'sinon'

import crmService from 'src/server/services/crmService'

export default {
  enable() {
    stub(crmService, 'getContactByEmail', () => {})
    stub(crmService, 'notifyContactSignedUp', () => true)
  },

  disable() {
    crmService.getContactByEmail.restore()
    crmService.notifyContactSignedUp.restore()
  },
}
