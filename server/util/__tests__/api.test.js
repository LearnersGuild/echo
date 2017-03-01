/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import {
  apiFetch,
  apiFetchAllPages,
} from '../api'

describe(testContext(__filename), function () {
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
