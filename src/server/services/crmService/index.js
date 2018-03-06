import {default as getContactByEmail} from './getContactByEmail'
import {default as notifyContactSignedUp} from './notifyContactSignedUp'
import {default as updateContactProperties} from './updateContactProperties'

/**
 * NOTE: this service's functions are exported the way they are to enable
 * certain stubbing functionality functionality for testing that relies on the
 * way the module is cached and later required by dependent modules.
 */
export default {
  getContactByEmail,
  notifyContactSignedUp,
  updateContactProperties,
}
