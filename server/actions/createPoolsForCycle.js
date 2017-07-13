import Promise from 'bluebird'

import {range, unique, groupById, shuffle} from 'src/common/util'
import {Pool, PoolMember} from 'src/server/services/dataService'
import findActiveVotingMembersInChapter from 'src/server/actions/findActiveVotingMembersInChapter'
import {POOL_NAMES, MAX_POOL_SIZE} from 'src/common/models/pool'

export default async function createPoolsForCycle(cycle) {
  const members = await findActiveVotingMembersInChapter(cycle.chapterId)
  const membersByPhaseId = groupById(members, 'phaseId')

  const poolAssignments = []
  membersByPhaseId.forEach(phaseMembers => {
    poolAssignments.push(..._splitMembersIntoPools(phaseMembers))
  })

  await _savePoolAssignments(cycle, poolAssignments)
}

function _splitMembersIntoPools(members) {
  const splitCount = Math.ceil(members.length / MAX_POOL_SIZE)
  const membersPerSplit = Math.ceil(members.length / splitCount)
  const shuffledMembers = shuffle(members.slice())

  return range(0, splitCount).map(() => {
    const membersForPool = shuffledMembers.splice(0, membersPerSplit)
    const phaseIds = unique(membersForPool.map(_ => _.phaseId))
    if (phaseIds.length !== 1) {
      throw new Error(`Invalid attempt to create a pool with members from multiple phases: [${phaseIds.join(',')}]`)
    }
    return {phaseId: phaseIds[0], members: membersForPool}
  })
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const pools = poolAssignments.map(({phaseId}, i) => ({
    phaseId,
    name: POOL_NAMES[i],
    cycleId: cycle.id,
  }))

  const newPools = Pool.save(pools)

  await Promise.map(newPools, (pool, i) => {
    const memberIds = poolAssignments[i].members.map(_ => _.id)
    const poolMembers = memberIds.map(memberId => ({memberId, poolId: pool.id}))
    return PoolMember.save(poolMembers)
  })
}
