import {connect} from 'src/db'
import config from 'src/config'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {getPlayerById} from 'src/server/db/player'
import {saveVote} from 'src/server/db/vote'
import {getCyclesInStateForChapter} from 'src/server/db/cycle'
import {getPoolByCycleIdAndPlayerId} from 'src/server/db/pool'
import findOpenRetroSurveysForPlayer from 'src/server/actions/findOpenRetroSurveysForPlayer'
import {
  LGNotAuthorizedError,
  LGBadRequestError,
  LGForbiddenError,
  LGInternalServerError,
} from 'src/server/util/error'

const r = connect()

async function _voteForGoals(user, goalDescriptors, responseURL) {
  if (!user) {
    throw new LGNotAuthorizedError()
  }

  const player = await getPlayerById(user.id, {mergeChapter: true})
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

  const [cycle] = cycles
  const pool = await getPoolByCycleIdAndPlayerId(cycle.id, player.id)

  // see if the player has already voted to determine whether to insert
  // or update
  const playerVotes = await r.table('votes')
    .getAll([player.id, pool.id], {index: 'playerIdAndPoolId'})

  const playerVote = playerVotes.length > 0 ?
    Object.assign({}, playerVotes[0], {
      notYetValidatedGoalDescriptors: goalDescriptors,
      pendingValidation: true,
      responseURL,
    }) : {
      playerId: player.id,
      poolId: pool.id,
      notYetValidatedGoalDescriptors: goalDescriptors,
      pendingValidation: true,
      responseURL,
    }
  delete playerVote.updatedAt
  const result = await saveVote(playerVote, {returnChanges: true})

  if (result.replaced || result.inserted) {
    const returnedVote = Object.assign({}, result.changes[0].new_val, {player, cycle})
    delete returnedVote.playerId
    delete returnedVote.poolId
    return returnedVote
  }

  throw new LGInternalServerError('Could not save vote.')
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
