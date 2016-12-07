/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'

import fields from '../index'

const query = 'query($identifiers: [String]) { findUsers(identifiers: $identifiers) { id name handle email phone avatarUrl profileUrl chapter { id name } } }'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('findUsers', function () {
    beforeEach('Create current user', async function () {
      this.currentUser = await factory.build('user')
      this.users = await factory.buildMany('user', 3)
      this.players = await Promise.map(this.users, user => factory.create('player', {id: user.id}))
      await factory.createMany('player', 5) // extra players
    })

    it('returns correct users for identifiers', async function () {
      useFixture.nockIDMfindUsers(this.users)
      const player = this.players[0]
      const result = await runGraphQLQuery(
        query,
        fields,
        {identifiers: [player.id]},
        {currentUser: this.currentUser},
      )
      const returned = result.data.findUsers[0]
      expect(result.data.findUsers.length).to.equal(this.players.length)
      expect(returned.id).to.equal(player.id)
      expect(returned.chapter.id).to.equal(player.chapterId)
    })

    it('returns all users if no identifiers specified', async function () {
      useFixture.nockIDMfindUsers(this.users)
      const result = await runGraphQLQuery(
        query,
        fields,
        null,
        {currentUser: this.currentUser},
      )
      expect(result.data.findUsers.length).to.equal(this.players.length)
      this.players.forEach(user => expect(result.data.findUsers.find(u => u.id === user.id)).to.exist)
    })

    it('returns no users if no matching identifiers specified', async function () {
      useFixture.nockIDMfindUsers([])
      const result = await runGraphQLQuery(
        query,
        fields,
        {identifiers: ['']},
        {currentUser: this.currentUser},
      )
      expect(result.data.findUsers.length).to.equal(0)
    })

    it('throws an error if user is not signed-in', function () {
      const result = runGraphQLQuery(query, fields, null, {currentUser: null})
      return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
    })
  })
})
