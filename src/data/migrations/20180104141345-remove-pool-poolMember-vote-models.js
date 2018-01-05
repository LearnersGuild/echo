export async function up(r, conn) {
  await r.tableDrop('pools').run(conn)
  await r.tableDrop('poolMembers').run(conn)
  await r.tableDrop('votes').run(conn)
}

export function down() {
 // this is irreversible
}
