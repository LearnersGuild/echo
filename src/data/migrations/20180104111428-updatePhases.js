export async function up(r) {
  const phases = await r.table('phases')

  if (phases.length < 5) {
    throw new Error('Invalid phase configurations:', phases)
  }

  const phase1 = phases.find(p => p.number === 1)
  const phase2 = phases.find(p => p.number === 2)
  const phase4 = phases.find(p => p.number === 4)
  const phase5 = phases.find(p => p.number === 5)

  // reassign members in Phase 1 to Phase 2
  // reassign members in Phase 4 to Phase 4
  await r.table('members').filter({phaseId: phase1.id}).update({phaseId: phase2.id})
  await r.table('members').filter({phaseId: phase5.id}).update({phaseId: phase4.id})

  // sync updated phase configuration (w/ P1 & p5 removed)
  const reloadDefaultModelData = require('src/server/actions/reloadDefaultModelData')
  return reloadDefaultModelData()
}

export function down() {
  // irreversible
}
