/* eslint-disable no-var */

var config = require('../config')
config()

exports.up = function up(r, conn) {
  return Promise.all([
    r.table('votes').indexCreate('cycleId').run(conn),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.table('votes').indexDrop('cycleId').run(conn),
  ])
}
