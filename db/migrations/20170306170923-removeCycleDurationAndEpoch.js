exports.up = function (r) {
  return Promise.all([
    r.table('chapters').update({
      cycleDuration: r.literal(),
      cycleEpoch: r.literal(),
    }),
  ])
}

exports.down = function (r) {
  return Promise.all([
    r.table('chapters').update({
      cycleDuration: '1 week',
      cycleEpoch: '2016-07-11T03:00:00.000Z',
    }),
  ])
}
