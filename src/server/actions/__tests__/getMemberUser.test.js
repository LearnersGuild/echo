/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'

import getMemberUser from '../getMemberUser'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    useFixture.nockClean()
  })

  it('returns correct member for identifier w/ IDM user properties', async function () {
    const user = await factory.build('user')
    const member = await factory.create('member', {id: user.id})
    await factory.createMany('member', 2) // extra members

    useFixture.nockIDMGetUser(user)

    const result = await getMemberUser(user.id)
    expect(result.id).to.equal(user.id)
    expect(result.handle).to.equal(user.handle)
    expect(result.email).to.equal(user.email)
    expect(result.avatarUrl).to.equal(user.avatarUrl)
    expect(result.profileUrl).to.equal(user.profileUrl)
    expect(result.chapterId).to.equal(member.chapterId)
  })

  it('returns null if user exists in IDM but not in echo', async function () {
    const user = await factory.build('user')
    useFixture.nockIDMGetUser(user)
    const result = await getMemberUser(user.id)
    return expect(result).to.not.exist
  })
})
