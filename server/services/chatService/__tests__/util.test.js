/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import url from 'url'

import {useFixture} from 'src/test/helpers'
import config from 'src/config'
import {
  apiURL,
  headers,
} from '../util'

describe(testContext(__filename), function () {
  describe('apiURL()', function () {
    useFixture.nockClean()
    it('returns a valid URL', function () {
      const path = '/some/path'
      const myURL = apiURL(path)
      const urlParts = url.parse(myURL)
      expect(urlParts.path).to.equal(path)
    })

    it('is a Slack URL', function () {
      expect(apiURL('/foo/bar')).to.match(new RegExp(config.server.chat.baseURL))
    })
  })

  describe('headers()', function () {
    it('merges the additional headers', function () {
      const additional = {foo: 'bar'}
      const allHeaders = headers(additional)
      expect(allHeaders).to.contain.all.keys('foo')
    })

    it('has Accept and Content-Type headers', function () {
      expect(headers({foo: 'bar'})).to.contain.all.keys('Accept', 'Content-Type')
    })
  })
})
