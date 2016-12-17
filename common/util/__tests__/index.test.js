/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {toSortedArray} from '../index'

describe(testContext(__filename), function () {
  describe('toSortedArray', function () {
    it('returns undefined if invalid collection', function () {
      const result = toSortedArray(null)
      expect(result).to.be.undefined
    })

    it('returns undefined if invalid field', function () {
      const result = toSortedArray({a: {v: 1}, b: {v: 2}}, null)
      expect(result).to.be.undefined
    })

    it('returns correctly sorted array if collection is an object', function () {
      const result = toSortedArray([{v: 2}, {v: 3}, {v: 1}], 'v')
      expect(result).to.deep.eq([{v: 1}, {v: 2}, {v: 3}])
    })

    it('returns correctly sorted array if collection is an array', function () {
      const result = toSortedArray({a: {v: 100}, b: {v: 5}, c: {v: -2}}, 'v')
      expect(result).to.deep.eq([{v: -2}, {v: 5}, {v: 100}])
    })

    it('returns correctly sorted array if field values are strings', function () {
      const result = toSortedArray({a: {v: 'zats'}, b: {v: 'blergh'}, c: {v: 'vloop'}}, 'v')
      expect(result).to.deep.eq([{v: 'blergh'}, {v: 'vloop'}, {v: 'zats'}])
    })

    it('returns array in reverse order if specified in options', function () {
      const result = toSortedArray({a: {v: 'zats'}, b: {v: 'blergh'}, c: {v: 'vloop'}}, 'v', {desc: true})
      expect(result).to.deep.eq([{v: 'zats'}, {v: 'vloop'}, {v: 'blergh'}])
    })
  })
})
