/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  range,
  choose,
} from '../util'

import {
  enumeratePartitionings,
  enumerateSubsets,
} from '../partitioning'

describe(testContext(__filename), function () {
  it('retuns all possible partitionings of a list into a list of lists of given sizes', function () {
    const result = [...enumeratePartitionings(['A', 'B', 'C', 'D'], [1, 3])]
    expect(_partitioningsToStrings(result).sort()).to.deep.eq(_partitioningsToStrings([
      [['A'], ['B', 'C', 'D']],
      [['B'], ['A', 'C', 'D']],
      [['C'], ['B', 'A', 'D']],
      [['D'], ['B', 'C', 'A']],
    ]).sort())
  })

  it('does not emit duplicate partitionings when there are dulpicate elements', function () {
    const result = [...enumeratePartitionings(['A', 'A', 'B'], [1, 2])]
    expect(_partitioningsToStrings(result).sort()).to.deep.eq(_partitioningsToStrings([
      [['A'], ['A', 'B']],
      [['B'], ['A', 'A']],
    ]).sort())
  })

  it('returns the expected number of results', function () {
    const result = [...enumeratePartitionings(range(0, 7), [2, 3, 2])]
    expect(result).to.have.length(choose(7, 2) * choose(5, 3))
  })

  it('accepts a pruning function to prune the tree', function () {
    const n = 4
    const k1 = 2
    const k2 = 2
    const shouldPrune = partialPartitioning => partialPartitioning[0].includes(0)
    const result = [...enumeratePartitionings(range(0, n), [k1, k2], shouldPrune)]
    expect(result).to.have.length(choose(n, k1) / 2)
  })

  it('handles empty partitions', function () {
    const result = [...enumeratePartitionings(['A', 'B'], [0, 1, 1])]
    expect(_partitioningsToStrings(result).sort()).to.deep.eq(_partitioningsToStrings([
      [[], ['A'], ['B']],
      [[], ['B'], ['A']],
    ]).sort())
  })

  describe('enumerateSubsets()', function () {
    it('returns all subsets for 4 choose 3', function () {
      expect([...enumerateSubsets(['A', 'B', 'C', 'D'], 3)]).to.deep.eq([
        ['A', 'B', 'C'],
        ['A', 'B', 'D'],
        ['A', 'C', 'D'],
        ['B', 'C', 'D'],
      ])
    })

    it('returns all subsets for 5 choose 3', function () {
      expect([...enumerateSubsets(['A', 'B', 'C', 'D', 'E'], 3)]).to.deep.eq([
        ['A', 'B', 'C'],
        ['A', 'B', 'D'],
        ['A', 'B', 'E'],
        ['A', 'C', 'D'],
        ['A', 'C', 'E'],
        ['A', 'D', 'E'],
        ['B', 'C', 'D'],
        ['B', 'C', 'E'],
        ['B', 'D', 'E'],
        ['C', 'D', 'E'],
      ])
    })

    it('returns all subsets for 5 choose 4', function () {
      expect([...enumerateSubsets(['A', 'B', 'C', 'D', 'E'], 4)]).to.deep.eq([
        ['A', 'B', 'C', 'D'],
        ['A', 'B', 'C', 'E'],
        ['A', 'B', 'D', 'E'],
        ['A', 'C', 'D', 'E'],
        ['B', 'C', 'D', 'E'],
      ])
    })

    it('does not emit duplicate subsets when there are dulpicate elements', function () {
      expect([...enumerateSubsets(['A', 'A', 'C', 'D'], 3)]).to.deep.eq([
        ['A', 'A', 'C'],
        ['A', 'A', 'D'],
        ['A', 'C', 'D'],
      ])
    })

    it('accepts a pruning function', function () {
      const shouldPrune = partialSubset => partialSubset.includes('C')
      expect([...enumerateSubsets(['A', 'B', 'C', 'D', 'E'], 4, shouldPrune)]).to.deep.eq([
        ['A', 'B', 'D', 'E'],
      ])
    })
  })
})

function _partitioningsToStrings(partitionings) {
  return partitionings.map(_partitioningToString)
}

function _partitioningToString(partitioning) {
  return partitioning.map(partition =>
    `[${partition.sort().join(',')}]`
  ).join(', ')
}
