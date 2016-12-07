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
  })

  it('returns correct user with chapter for identifier', async function () {
    const user = await factory.build('user')
    const player = await factory.create('player', {id: user.id})
    await factory.createMany('player', 2) // extra players

    useFixture.nockIDMGetUser(user)

    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: user.handle},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getUser
    expect(returned.id).to.equal(user.id)
    expect(returned.handle).to.equal(user.handle)
    expect(returned.email).to.equal(user.email)
    expect(returned.avatarUrl).to.equal(user.avatarUrl)
    expect(returned.profileUrl).to.equal(user.profileUrl)
    expect(returned.chapter.id).to.equal(player.chapterId)
  })

  it('throws an error if user is not found', function () {
    useFixture.nockIDMGetUser(null)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: 'fake.identifier'},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/User not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, {identifier: ''}, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
