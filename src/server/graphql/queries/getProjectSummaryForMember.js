import {
  getLatestCycleForChapter,
  findProjectsForMember,
  Project,
} from 'src/server/services/dataService'
import assertUserIsMember from 'src/server/actions/assertUserIsMember'
import {ProjectsSummary} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: ProjectsSummary,
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const member = await assertUserIsMember(currentUser.id)
    const cycle = await getLatestCycleForChapter(member.chapterId)

    const numActiveProjectsForCycle = await Project.filter({chapterId: member.chapterId, cycleId: cycle.id}).count()
    const numTotalProjectsForMember = await findProjectsForMember(member.id).count()

    return {numActiveProjectsForCycle, numTotalProjectsForMember}
  },
}
