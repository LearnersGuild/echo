/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  range,
  shuffle,
  choose,
} from '../index'

describe(testContext(__filename), function () {
  describe('range', function () {
    it('returns an array with the given range of integers', function () {
      expect(range(0, 4)).to.deep.eq([0, 1, 2, 3])
      expect(range(5, 5)).to.deep.eq([5, 6, 7, 8, 9])
      expect(range(-3, 6)).to.deep.eq([-3, -2, -1, 0, 1, 2])
    })
  })

  describe('choose', function () {
    it('returns the result of the mathematical operation N choose K', function () {
      expect(choose(4, 2)).to.eq(6)
      expect(choose(5, 2)).to.eq(10)
      expect(choose(20, 10)).to.eq(184756)
    })
  })

  describe('shuffle', function () {
    it('randomizes the order of an array in place', function () {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffle(original.slice(0))
      expect(shuffled.sort()).to.deep.eq(original.sort())
    })
  })
})
