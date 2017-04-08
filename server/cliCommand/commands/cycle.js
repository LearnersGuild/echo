import {CYCLE_STATES, PRACTICE, REFLECTION} from 'src/common/models/cycle'
import {userCan} from 'src/common/util'

import {getModeratorById} from 'src/server/db/moderator'
import {getCyclesInStateForChapter} from 'src/server/db/cycle'
import createNextCycleForChapter from 'src/server/actions/createNextCycleForChapter'
import updateCycleState from 'src/server/actions/updateCycleState'
import {
  LGCLIUsageError,
  LGNotAuthorizedError,
  LGForbiddenError,
  LGBadRequestError,
} from 'src/server/util/error'

const subcommands = {
  async init(args, {user}) {
    await _createCycle(user, args.hours)

    const attachments = []
    if (args.hours) {
      attachments.push({text: `Expected hours per project: ${args.hours}`})
    }
    return {
      text: '🔃  Initializing Cycle ... stand by.',
      attachments,
    }
  },

  async launch(args, {user}) {
    await _changeCycleState(user, PRACTICE)

    return {
      text: '🚀  Initiating Launch ... stand by.',
    }
  },

  async reflect(args, {user}) {
    await _changeCycleState(user, REFLECTION)

    return {
      text: '🤔  Initiating Reflection... stand by.',
    }
  },
}

export async function invoke(args, options) {
  if (args._.length >= 1) {
    const subcommand = args._[0]
    return await subcommands[subcommand](args.$[subcommand], options)
  }

  throw new LGCLIUsageError()
}

async function _createCycle(user, hours) {
  if (!userCan(user, 'createCycle')) {
    throw new LGNotAuthorizedError()
  }

  const moderator = await getModeratorById(user.id)
  if (!moderator) {
    throw new LGNotAuthorizedError('You are not a moderator for the game.')
  }
  if (!moderator.chapterId) {
    throw new LGForbiddenError('You must be assigned to a chapter to start a new cycle.')
  }

  return await createNextCycleForChapter(moderator.chapterId, hours)
}

async function _changeCycleState(user, newState) {
  const newStateIndex = CYCLE_STATES.indexOf(newState)
  if (!userCan(user, 'updateCycle')) {
    throw new LGNotAuthorizedError()
  }
  if (newStateIndex === -1) {
    throw new LGBadRequestError(`Invalid cycle state ${newState}`)
  }
  if (newStateIndex === 0) {
    throw new LGForbiddenError(`You cannot change the cycle state back to ${newState}`)
  }

  const moderator = await getModeratorById(user.id, {mergeChapter: true})
  if (!moderator) {
    throw new LGNotAuthorizedError('You are not a moderator for the game')
  }
  const validOriginState = CYCLE_STATES[newStateIndex - 1]
  const cycles = await getCyclesInStateForChapter(moderator.chapter.id, validOriginState)
  if (!cycles.length > 0) {
    throw new LGForbiddenError(`No cycles for ${moderator.chapter.name} chapter (${moderator.chapter.id}) in ${validOriginState} state`)
  }

  return updateCycleState(cycles[0], newState)
}
