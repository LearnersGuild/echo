/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {
  factorial
} from 'src/server/util'

describe(testContext(__filename), function () {
  describe('factorial()', function () {
    it('computes factorial', function () {
      expect(factorial(0)).to.eq(1)
      expect(factorial(1)).to.eq(1)
      expect(factorial(4)).to.eq(4 * 3 * 2 * 1)
      expect(factorial(8)).to.eq(8 * 7 * 6 * 5 * 4 * 3 * 2 * 1)
      expect(factorial(25)).to.eq(15511210043330985984000000)
    })
  })
})
