/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getUserSummary(identifier: $identifier) {
      user {
        id handle
        chapter { id }
      }
      userProjectSummaries {
        project { id name }
        userProjectReviews {
          contribution
          technical
          culture
          submittedBy { id name handle }
        }
        userProjectStats { rating xp }
      }
    }
  }
`

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user', {roles: ['moderator']})
    this.user = await factory.build('user')
  })

  it('returns correct summary for user identifier', async function () {
    useFixture.nockIDMGetUser(this.user)
    const player = await factory.create('player', {id: this.user.id})
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: player.id},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getUserSummary
    expect(returned.user.id).to.equal(this.user.id)
    expect(returned.user.handle).to.equal(this.user.handle)
    expect(returned.user.chapter.id).to.equal(player.chapterId)
  })

  it('throws an error if user is not found', function () {
    useFixture.nockIDMGetUser(this.user)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/User not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: null}
    )
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
