/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {
  toSortedArray,
  findAny,
  factorial,
  range,
  segment,
  sortByAttr,
  without,
} from '../index'

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

  describe('sortByAttr', function () {
    it('sorts objects by the specified attribute', function () {
      expect(sortByAttr([{a: 1}, {a: 3}, {a: 2}], 'a'))
        .to.deep.eq([{a: 1}, {a: 2}, {a: 3}])
    })

    it('accepts multiple attributes in order of precedence', function () {
      expect(sortByAttr([
        {a: 1, b: 'z'},
        {a: 2, b: 'f'},
        {a: 1, b: 'a'},
      ], 'a', 'b'))
      .to.deep.eq([
        {a: 1, b: 'a'},
        {a: 1, b: 'z'},
        {a: 2, b: 'f'},
      ])
    })
  })

  describe('findAny', function () {
    it('returns undefined if invalid collection', function () {
      const result = findAny(null, 123, 'id')
      expect(result).to.be.undefined
    })

    it('returns undefined if invalid fields', function () {
      const result = findAny([{id: 123}], 123, null)
      expect(result).to.be.undefined
    })

    it('returns matching value if collection is an object, field is a string', function () {
      const id = 123
      const result = findAny([{id}], id, 'id')
      expect(result.id).to.eq(id)
    })

    it('returns matching value if collection is an object, field is an array', function () {
      const id = 123
      const result = findAny([{id}], id, ['name', 'id'])
      expect(result.id).to.eq(id)
    })

    it('returns matching value if collection is an array, field is a string', function () {
      const id = 123
      const result = findAny({[id]: {id}}, id, 'id')
      expect(result.id).to.eq(id)
    })

    it('returns matching value if collection is an array, field is an array', function () {
      const id = 123
      const result = findAny({[id]: {id}}, id, ['name', 'id'])
      expect(result.id).to.eq(id)
    })
  })

  describe('factorial()', function () {
    it('computes factorial', function () {
      expect(factorial(0)).to.eq(1)
      expect(factorial(1)).to.eq(1)
      expect(factorial(4)).to.eq(4 * 3 * 2 * 1)
      expect(factorial(8)).to.eq(8 * 7 * 6 * 5 * 4 * 3 * 2 * 1)
      expect(factorial(25)).to.eq(15511210043330985984000000)
    })
  })

  describe('segment()', function () {
    it('divides a list into several segments', function () {
      expect(
        segment([1, 2, 3, 4, 5, 6], 3)
      ).to.deep.eq(
        [[1, 2], [3, 4], [5, 6]]
      )
    })

    it('handles the case where the list does not segment evenly', function () {
      expect(
        segment([1, 2, 3, 4, 5], 3)
      ).to.deep.eq(
        [[1, 2], [3, 4], [5]]
      )
    })
  })

  describe('range()', function () {
    it('returns correct array for range (0...4)', function () {
      expect(
        range(0, 4)
      ).to.deep.eq(
        [0, 1, 2, 3]
      )
    })

    it('returns correct array for range (1...1)', function () {
      expect(
        range(1, 1)
      ).to.deep.eq(
        [1]
      )
    })

    it('returns empty array for range (0...0)', function () {
      expect(
        range(0, 0)
      ).to.deep.eq(
        []
      )
    })
  })

  describe('without()', function () {
    it('excludes correct element', function () {
      expect(
        without([1, 2, 3], 3)
      ).to.deep.eq(
        [1, 2]
      )
    })
  })
})
