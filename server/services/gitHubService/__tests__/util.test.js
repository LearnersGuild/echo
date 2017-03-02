/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import url from 'url'

import config from 'src/config'
import {
  apiURL,
  headers,
} from '../util'

describe(testContext(__filename), function () {
  describe('apiURL()', function () {
    it('returns a valid URL', function () {
      const path = '/some/path'
      const myURL = apiURL(path)
      const urlParts = url.parse(myURL)
      expect(urlParts.path).to.equal(path)
    })

    it('is a GitHub URL', function () {
      expect(apiURL('/foo/bar')).to.match(new RegExp(config.server.github.baseURL))
    })
  })

  describe('headers()', function () {
    it('merges the additional headers', function () {
      const additional = {'Content-Type': 'application/json'}
      const allHeaders = headers(additional)
      expect(allHeaders).to.contain.all.keys('Content-Type')
      expect(allHeaders['Content-Type']).to.equal(additional['Content-Type'])
    })

    it('has Authorization and Accept headers', function () {
      expect(headers({foo: 'bar'})).to.contain.all.keys('Accept', 'Authorization')
    })
  })
})
