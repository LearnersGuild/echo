import {r, errors, Cycle, Member, Phase, Pool, PoolMember} from 'src/server/services/dataService'
import {LGBadRequestError, LGInternalServerError} from 'src/server/util/error'

export default async function addMemberToPoolInCycle(cycleId, memberId) {
  const cycle = typeof cycleId === 'string' ? await Cycle.get(cycleId) : cycleId
  const member = typeof memberId === 'string' ? await Member.get(memberId).getJoin({phase: true}) : memberId
  const phase = member.phase || (member.phaseId ? await Phase.get(member.phaseId) : null)
  if (!phase) {
    throw new LGBadRequestError(`Member ${member.id} must be assigned to a phase to be added to a pool`)
  }

  const newestPool = await Pool.filter({cycleId: cycle.id, phaseId: phase.id})
    .orderBy(r.desc('createdAt'))
    .nth(0)
    .default(null)
    .catch(errors.DocumentNotFound, () => {})

  if (!newestPool) {
    if (phase.hasVoting === false) {
      throw new LGBadRequestError(`There are no pools for cycle ${cycle.id} and phase ${phase.id}; phase is not a voting phase`)
    }
    throw new LGInternalServerError(`No existing pool found for voting phase ${phase.id} and cycle ${cycle.id}`)
  }

  return PoolMember.save({
    poolId: newestPool.id,
    memberId: member.id,
  })

  // TODO: if pool is now too big, split
}
