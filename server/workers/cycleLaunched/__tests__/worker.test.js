/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {processCycleLaunch} from 'src/server/workers/cycleLaunched/worker'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processCycleLaunch()', function () {
    describe('when a cycle has been launched', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter')
        this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, cycleNumber: 3})
        this.pool = await factory.create('pool', {cycleId: this.cycle.id})
      })

      it('does not throw an error when no votes have been submitted', function () {
        expect(processCycleLaunch(this.cycle)).to.not.be.rejected
      })
    })
  })
})
