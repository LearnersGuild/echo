export async function up(r, conn) {
  await Promise.all([
    r.tableDrop('pools').run(conn),
    r.tableDrop('poolMembers').run(conn),
    r.tableDrop('votes').run(conn),
  ])
}

export function down() {
 // this is irreversible
}
