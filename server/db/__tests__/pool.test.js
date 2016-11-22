/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  savePool,
  getPoolById,
  poolsTable,
} from 'src/server/db/pool'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('savePool()', function () {
    it('updates existing record when id provided', async function () {
      const pool = await factory.create('pool')
      const updatedPool = Object.assign({}, pool, {newAttr: 'newVal'})
      await savePool(updatedPool)
      const savedRecord = await getPoolById(pool.id)
      expect(savedRecord).to.have.property('newAttr', 'newVal')
    })

    it('saves a new record when new id provided', async function () {
      const newPool = await factory.build('pool')
      await savePool(newPool)
      const count = await poolsTable.count()
      expect(count).to.eq(1)
    })

    it('saves a new record when no id provided', async function () {
      const newPool = await factory.build('pool')
      delete newPool.id
      await savePool(newPool)
      const count = await poolsTable.count()
      expect(count).to.eq(1)
    })
  })
})
