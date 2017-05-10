import config from 'src/config'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import findOpenRetroSurveysForPlayer from 'src/server/actions/findOpenRetroSurveysForPlayer'
import findUnreviewedProjectsForCoach from 'src/server/actions/findUnreviewedProjectsForCoach'
import {
  Player,
  Vote,
  getCyclesInStateForChapter,
  getPoolByCycleIdAndPlayerId,
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

  const player = await Player.get(user.id).getJoin({chapter: true})
  if (!player) {
    throw new LGNotAuthorizedError('You are not a player in the game.')
  }

  if (goalDescriptors.length > 1 && goalDescriptors[0] === goalDescriptors[1]) {
    throw new LGBadRequestError('You cannot vote for the same goal twice.')
  }

  const cycles = await getCyclesInStateForChapter(player.chapter.id, GOAL_SELECTION)
  if (!cycles.length > 0) {
    throw new LGForbiddenError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in ${GOAL_SELECTION} state.`)
  }

  const openRetroSurveys = await findOpenRetroSurveysForPlayer(player.id)
  if (openRetroSurveys.length !== 0) {
    throw new LGBadRequestError(`You must complete all pending retrospective surveys before voting for a new project! For a list of open retros see ${config.server.baseURL}/retro.`)
  }

  const unreviewedProjects = await findUnreviewedProjectsForCoach(player.id)
  if (unreviewedProjects.length !== 0) {
    const unreviewedNames = unreviewedProjects.map(project => project.name).join(', ')
    throw new LGBadRequestError(`You must review the projects for which you were a coach before voting for a new project! These projects have yet to be reviewed: ${unreviewedNames}`)
  }

  const cycle = cycles[0]
  const pool = await getPoolByCycleIdAndPlayerId(cycle.id, player.id)
  const previousVotes = await Vote.getAll([player.id, pool.id], {index: 'playerIdAndPoolId'})

  const voteValues = {
    notYetValidatedGoalDescriptors: goalDescriptors,
    pendingValidation: true,
    responseURL,
  }
  const savedVote = previousVotes[0] ?
    await Vote.get(previousVotes[0].id).updateWithTimestamp(voteValues) :
    await Vote.save({
      ...voteValues,
      playerId: player.id,
      poolId: pool.id,
    })

  return {...savedVote, player, cycle}
}

export async function invoke(args, {user, responseURL}) {
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
