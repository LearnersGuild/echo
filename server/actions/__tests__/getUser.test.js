/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'

import getUser from '../getUser'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(function () {
    useFixture.nockClean()
  })

  it('returns correct user for identifier', async function () {
    const user = await factory.build('user')
    const player = await factory.create('player', {id: user.id})
    await factory.createMany('player', 2) // extra players

    useFixture.nockIDMGetUser(user)

    const result = await getUser(user.id)
    expect(result.id).to.equal(user.id)
    expect(result.handle).to.equal(user.handle)
    expect(result.email).to.equal(user.email)
    expect(result.avatarUrl).to.equal(user.avatarUrl)
    expect(result.profileUrl).to.equal(user.profileUrl)
    expect(result.chapterId).to.equal(player.chapterId)
  })

  it('returns null if user exists in IDM but not in game', async function () {
    const user = await factory.build('user')
    useFixture.nockIDMGetUser(user)
    const result = await getUser(user.id)
    return expect(result).to.not.exist
  })
})
