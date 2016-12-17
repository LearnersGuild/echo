/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'

import fields from '../index'

const query = `
  query($identifiers: [String]) {
    findUsers(identifiers: $identifiers) {
      id name handle avatarUrl
      chapter { id name }
    }
  }
`

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user')
    this.users = await factory.buildMany('user', 3)
    this.player = await factory.create('player', {id: this.users[0].id})
    await factory.createMany('player', 5) // extra players
  })

  it('returns correct users with resolved chapters for identifiers', async function () {
    const player = this.player
    const user = this.users[0]
    useFixture.nockIDMFindUsers([user])
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifiers: [player.id]},
      {currentUser: this.currentUser},
    )
    expect(result.data.findUsers.length).to.equal(1)
    const [returned] = result.data.findUsers
    expect(returned.id).to.equal(user.id)
    expect(returned.name).to.equal(user.name)
    expect(returned.avatarUrl).to.equal(user.avatarUrl)
    expect(returned.chapter.id).to.equal(player.chapterId)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, null, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
