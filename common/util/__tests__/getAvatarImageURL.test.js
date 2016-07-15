/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import url from 'url'
import getAvatarImageURL from '../getAvatarImageURL'

// TODO: use nock to mock gravatar API
describe(testContext(__filename), function () {
  it('returns throws an exception if the user has no handle', function () {
    expect(() => getAvatarImageURL({handle: null})).to.throw(/user has no handle/)
  })

  it('returns a url', function () {
    const urlParts = url.parse(getAvatarImageURL({handle: 'somehandle'}))
    expect(urlParts).to.have.property('protocol')
    expect(urlParts).to.have.property('host')
  })
})
