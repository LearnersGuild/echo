/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('processCycleLaunched()', function () {
    describe('when a cycle has been launched', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter')
        this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, cycleNumber: 3})
        this.pool = await factory.create('pool', {cycleId: this.cycle.id})
      })
    })
  })
})
