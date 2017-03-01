/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import url from 'url'
import nock from 'nock'

import {
  apiURL,
  headers,
  apiFetch,
  apiFetchAllPages,
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
      expect(apiURL('/foo/bar')).to.match(/github\.com/)
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

  describe('apiFetch()', function () {
    it('throws an error if unsuccessful', function () {
      nock('https://api.example.com')
        .get('/some/path')
        .reply(401, 'Not Authorized')
        .get('/some/other/path')
        .reply(500, 'Internal Server Error')

      return Promise.all([
        expect(() => apiFetch('https://api.example.com/some/path')).to.throw,
        expect(() => apiFetch('https://api.example.com/some/other/path')).to.throw,
      ])
    })

    it('returns a Promise of data if successful', function () {
      const expectedResults = [
        {title: 'first'},
        {title: 'second'},
      ]
      nock('https://api.example.com')
        .get('/yet/another/path')
        .reply(200, JSON.stringify(expectedResults))

      return apiFetch('https://api.example.com/yet/another/path')
        .then(data => expect(data).to.deep.equal(expectedResults))
    })
  })

  describe('apiFetchAllPages()', function () {
    it('returns a Promise of all pages of data if successful', function () {
      const page1Data = [
        {title: 'first'},
        {title: 'second'},
      ]
      const page2Data = [
        {title: 'third'},
        {title: 'fourth'},
      ]
      const page3Data = [
        {title: 'fifth'},
        {title: 'sixth'},
      ]
      const expectedResults = page1Data.concat(page2Data).concat(page3Data)

      nock('https://api.example.com')
        .get('/yet/another/path')
        .reply(200, JSON.stringify(page1Data), {
          Link: '<https://api.example.com/yet/another/path?page=2>; rel="next", <https://api.example.com/yet/another/path?page=3>; rel="last"'
        })
        .get('/yet/another/path?page=2')
        .reply(200, JSON.stringify(page2Data), {
          Link: '<https://api.example.com/yet/another/path?page=3>; rel="next", <https://api.example.com/yet/another/path?page=3>; rel="last"'
        })
        .get('/yet/another/path?page=3')
        .reply(200, JSON.stringify(page3Data), {
          Link: '<https://api.example.com/yet/another/path?page=3>; rel="last"'
        })

      return apiFetchAllPages('https://api.example.com/yet/another/path')
        .then(data => expect(data).to.deep.equal(expectedResults))
    })
  })
})
