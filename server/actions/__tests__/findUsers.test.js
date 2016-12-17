/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'

import findUsers from '../findUsers'

describe(testContext(__filename), function () {
  before(truncateDBTables)
  before(async function () {
    this.players = await factory.createMany('player', 5)
    this.users = this.players.map(player => ({
      id: player.id,
      handle: `handle_${player.id}`,
    }))
  })
  beforeEach(function () {
    useFixture.nockClean()
  })

  describe('findUsers()', function () {
    it('returns correct users for handle identifiers', async function () {
      const users = this.users.slice(0, 2)
      useFixture.nockIDMFindUsers(users)
      const result = await findUsers(users.map(u => u.handle))
      expectArraysToContainTheSameElements(result.map(u => u.id), users.map(u => u.id))
    })

    it('returns correct users for UUIDs', async function () {
      const users = this.players.slice(0, 5)
      useFixture.nockIDMFindUsers(users)
      const result = await findUsers(users.map(u => u.id))
      expectArraysToContainTheSameElements(result.map(u => u.id), users.map(u => u.id))
    })

    it('returns only unique users', async function () {
      const user = this.users[0]
      const {id, handle} = user
      useFixture.nockIDMFindUsers([user, user])
      const result = await findUsers([id, handle])
      expect(result.length).to.equal(1)
    })

    it('returns all IDM fields if none specified', async function () {
      useFixture.nockIDMFindUsers(this.users)
      const user = this.users[0]
      const player = this.players.find(p => p.id === user.id)
      const [result] = await findUsers([user.id])
      expect(result.id).to.equal(user.id)
      expect(result.handle).to.equal(user.handle)
      expect(result.name).to.equal(user.name)
      expect(result.email).to.equal(user.email)
      expect(result.chapterId).to.equal(player.chapterId)
    })

    it('returns only specified IDM fields', async function () {
      useFixture.nockIDMFindUsers(this.users)
      const user = this.users[0]
      const idmFields = ['handle']
      const [result] = await findUsers([user.id], {idmFields})
      expect(result.id).to.equal(user.id)
      expect(result.handle).to.equal(user.handle)
      expect(result.name).to.not.exist
      expect(result.email).to.not.exist
    })

    it('returns all users if no identifiers specified', async function () {
      useFixture.nockIDMFindUsers(this.users)
      const result = await findUsers()
      expect(result.length).to.equal(this.users.length)
      expectArraysToContainTheSameElements(result.map(u => u.id), this.users.map(p => p.id))
    })

    it('returns no users if no matching identifiers specified', async function () {
      useFixture.nockIDMFindUsers([])
      const result = await findUsers([this.users[0].id])
      expect(result.length).to.equal(0)
    })
  })
})
