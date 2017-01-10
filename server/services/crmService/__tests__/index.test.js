/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import crmContact from 'src/test/helpers/hubSpotContact'

import {
  getContactByEmail,
  notifyContactSignedUp,
} from '../index'

const crmBaseUrl = config.server.crm.baseURL
const crmKey = config.server.crm.key

const contactEmail = encodeURIComponent(crmContact.properties.email.value)

describe(testContext(__filename), function () {
  describe('getContactByEmail()', function () {
    beforeEach(function () {
      nock(crmBaseUrl)
        .get(`/contacts/v1/contact/email/${contactEmail}/profile?hapikey=${crmKey}`)
        .reply(200, crmContact)
    })

    it('returns the parsed response on success', function () {
      const result = getContactByEmail('tanner+test@learnersguild.org')
      return expect(result).to.eventually.have.property('vid', crmContact.vid)
    })
  })

  describe('notifyContactSignedUp()', function () {
    beforeEach(function () {
      nock(crmBaseUrl)
        .get(`/contacts/v1/contact/email/${contactEmail}/profile?hapikey=${crmKey}`)
        .reply(200, crmContact)
        .post(`/contacts/v1/contact/vid/${crmContact.vid}/profile?hapikey=${crmKey}`)
        .reply(204)
    })

    it('returns true on success', function () {
      const result = notifyContactSignedUp('tanner+test@learnersguild.org')
      return expect(result).to.eventually.equal(true)
    })
  })
})
