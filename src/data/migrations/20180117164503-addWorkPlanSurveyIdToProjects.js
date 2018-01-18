exports.up = function (r) {
  return r.table('projects').delete()
}

exports.down = function () {
  // irreversible
}
