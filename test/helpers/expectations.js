/* global expect */
export function expectArraysToContainTheSameElements(a, b) {
  expect(a.length).to.equal(b.length)
  expect(a.sort()).to.deep.equal(b.sort())
}

export function expectSetEquality(a, b) {
  return expect(unique(a)).to.deep.equal(unique(b))
}

function unique(array) {
  return Array.from(new Set(array)).sort()
}
