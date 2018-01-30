export async function up(r, conn) {
  const reloadDefaultModelData = require('src/server/actions/reloadDefaultModelData')

  await Promise.all([
    r.table('feedbackTypes').delete().run(conn),
    r.table('phases').delete().run(conn),
    r.table('questions').delete().run(conn),
    r.table('surveyBlueprints').delete().run(conn),
  ])

  return reloadDefaultModelData()
}

export function down() {
  // irreversible; data from dropped table not recoverable
}
