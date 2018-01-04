export function up() {
  const reloadDefaultModelData = require('src/server/actions/reloadDefaultModelData')
  return reloadDefaultModelData()
}

export function down() {
  // irreversible
}
