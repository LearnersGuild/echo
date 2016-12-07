/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getUser(identifier: $identifier) {
      id name handle email avatarUrl profileUrl
      chapter { id name }
    }
  }
`

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user')
    this.user = await factory.build('user')
  })

  it('returns correct user for identifier', async function () {
    useFixture.nockIDMGetUser(this.user)
    const player = await factory.create('player', {id: this.user.id})
    await factory.createMany('player', 2) // extra players
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: this.user.handle},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getUser
    expect(returned.id).to.equal(player.id)
    expect(returned.handle).to.equal(this.user.handle)
    expect(returned.email).to.equal(this.user.email)
    expect(returned.avatarUrl).to.equal(this.user.avatarUrl)
    expect(returned.profileUrl).to.equal(this.user.profileUrl)
    expect(returned.chapter.id).to.equal(player.chapterId)
  })

  it('throws an error if user is found in IDM but not in game', function () {
    useFixture.nockIDMGetUser(this.user)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: this.user.id},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/User not found/i)
  })

  it('throws an error if user is not found in IDM', function () {
    useFixture.nockIDMGetUser(null)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/User not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, {identifier: ''}, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
