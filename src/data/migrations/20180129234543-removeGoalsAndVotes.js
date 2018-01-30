export async function up(r, conn) {
  // delete `pools`, `poolMembers`, & `votes` tables
  await Promise.all([
    r.tableDrop('pools').run(conn),
    r.tableDrop('poolMembers').run(conn),
    r.tableDrop('votes').run(conn),
  ])

  // remove `goal` props from existing projects
  await r.table('projects').replace(row => (
    row.without('goal')
  ))
}

export function down() {
  // irreversible; data from dropped table not recoverable
}
