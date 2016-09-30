//
// Given a list of items and a list of partition sizes, return the
// set of all possible partitionings of the items in the list into
// partitions of the given sizes.
//
export function * enumeratePartitionings(list, partitionSizes, shouldPrunePartitioning, partitioning = []) {
  const [thisPartitionSize, ...otherPartitionSizes] = partitionSizes

  const shouldPruneSubset = subset => {
    if (shouldPrunePartitioning) {
      const partialPartitioning = partitioning.concat([subset])
      return shouldPrunePartitioning(partialPartitioning)
    }
  }

  if (!thisPartitionSize) {
    yield partitioning
    return
  }

  for (const subset of enumerateSubsets(list, thisPartitionSize, shouldPruneSubset)) {
    const newList = list.slice(0)
    subset.forEach(item => {
      newList.splice(newList.indexOf(item), 1)
    })

    yield * enumeratePartitionings(newList, otherPartitionSizes, shouldPrunePartitioning, partitioning.concat([subset]))
  }
}

export function * enumerateSubsets(list, subsetSize, shouldPrune) {
  if (subsetSize === 0) {
    yield []
    return
  }

  const n = list.length
  const k = subsetSize
  const indexesToValues = indexes => indexes.map(i => list[i])
  const shouldPruneByIndexes = subsetIndexes => shouldPrune && shouldPrune(indexesToValues(subsetIndexes))

  const seen = new Set()
  for (const subsetIndexes of enumerateNchooseKIndexes(n, k, shouldPruneByIndexes)) {
    const subset = indexesToValues(subsetIndexes)
    const key = subset.toString()

    if (!seen.has(key)) {
      yield subset
    }

    seen.add(key)
  }
}

// Efficient algorithm for getting all the ways to choose some
// number of elements from a list.
//
// From: http://www.cs.colostate.edu/~anderson/cs161/wiki/doku.php?do=export_s5&id=slides:week8
function * enumerateNchooseKIndexes(n, k, shouldPrune, p = 0, low = 0, subset = []) {
  const high = n - 1 - k + p + 1

  for (let i = low; i <= high; i++) {
    subset[p] = i

    if (shouldPrune && shouldPrune(subset)) {
      continue
    }

    if (p >= k - 1) {
      yield subset.concat()
    } else {
      yield * enumerateNchooseKIndexes(n, k, shouldPrune, p + 1, i + 1, subset)
    }
  }
}
