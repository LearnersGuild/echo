import config from 'src/config'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {
  Member,
  Vote,
  getCyclesInStateForChapter,
  getPoolByCycleIdAndMemberId,
} from 'src/server/services/dataService'
import {
  LGNotAuthorizedError,
  LGBadRequestError,
  LGForbiddenError,
} from 'src/server/util/error'

async function _voteForGoals(user, goalDescriptors, responseURL) {
  if (!user) {
    throw new LGNotAuthorizedError()
  }

  const member = await Member.get(user.id).getJoin({chapter: true, phase: true})
  if (!member) {
    throw new LGNotAuthorizedError('You must be a member to vote.')
  }

  if (goalDescriptors.length > 1 && goalDescriptors[0] === goalDescriptors[1]) {
    throw new LGBadRequestError('You cannot vote for the same goal twice.')
  }

  const cycles = await getCyclesInStateForChapter(member.chapter.id, GOAL_SELECTION)
  if (!cycles.length > 0) {
    throw new LGForbiddenError(`No cycles for ${member.chapter.name} chapter (${member.chapter.id}) in ${GOAL_SELECTION} state.`)
  }

  if (!member.phase || member.phase.hasVoting === false) {
    throw new LGForbiddenError('Vote blocked; you must be in a Phase with voting enabled')
  }

  const cycle = cycles[0]
  const pool = await getPoolByCycleIdAndMemberId(cycle.id, member.id)
  const previousVotes = await Vote.getAll([member.id, pool.id], {index: 'memberIdAndPoolId'})

  const voteValues = {
    notYetValidatedGoalDescriptors: goalDescriptors,
    pendingValidation: true,
    responseURL,
  }
  const savedVote = previousVotes[0] ?
    await Vote.get(previousVotes[0].id).updateWithTimestamp(voteValues) :
    await Vote.save({
      ...voteValues,
      memberId: member.id,
      poolId: pool.id,
    })

  return {...savedVote, member, cycle}
}

export default async function invoke(args, {user, responseURL}) {
  const attachments = []
  if (args._.length > 0) {
    await _voteForGoals(user, args._, responseURL)
    attachments.push({text: `You voted for: ${args._.join(', ')}.`})
  }

  return {
    text: `Click to see <${config.app.baseURL}/cycle-voting-results|current cycle voting results>.`,
    attachments,
  }
}
