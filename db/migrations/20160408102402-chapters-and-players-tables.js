/* eslint-disable no-var */

var config = require('../config')
var createOptions = config.createOptions
config()

exports.up = function up(r, conn) {
  return Promise.all([
    r.tableCreate('chapters', createOptions)
      .run(conn)
      .then(() => {
        return Promise.all([
          r.table('chapters').indexCreate('channelName').run(conn),
          r.table('chapters').indexCreate('inviteCodes', {multi: true}).run(conn),
        ])
      }),
    r.tableCreate('players', createOptions)
      .run(conn)
      .then(() => {
        return r.table('players').indexCreate('chapterId').run(conn)
      }),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.tableDrop('players').run(conn),
    r.tableDrop('chapters').run(conn),
  ])
}
