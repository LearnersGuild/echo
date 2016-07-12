import raven from 'raven'

import {GraphQLError} from 'graphql/error'
import {parseQueryError} from '../../../server/db/errors'
import {getPlayerById} from '../../../server/db/player'
import {getLatestCycleForChapter} from '../../../server/db/cycle'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export async function assertPlayersCurrentCycleInState(currentUser, state) {
  const player = await getPlayerById(currentUser.id, {mergeChapter: true})
  const cycleInReflection = await getLatestCycleForChapter(player.chapter.id)('state')
    .eq(state)

  if (!cycleInReflection) {
    throw new GraphQLError(`This action is not allowed when the cycle is not in the ${state} state`)
  }
}

export function handleError(unparsedError, defaultMsg) {
  const err = parseQueryError(unparsedError)
  if (err.name === 'BadInputError' || err.name === 'LGCustomQueryError') {
    throw err
  }
  console.error(err.stack)
  sentry.captureException(err)
  console.log('>>DUMP:', JSON.stringify(defaultMsg, null, 4))
  throw new GraphQLError(defaultMsg || err)
}

