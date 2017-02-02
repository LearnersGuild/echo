import faker from 'faker'

import {connect} from 'src/db'

const r = connect()
const now = new Date()

export default function define(factory) {
  const commonFields = {
    id: cb => cb(null, faker.random.uuid()),
    playerId: factory.assoc('player', 'id'),
    pendingValidation: false,
    notYetValidatedGoalDescriptors: null,
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  }
  const goals = cb => cb(null, [{
    url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/50',
    title: 'omnis nam beatae',
  }, {
    url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/49',
    title: 'quia expedita nesciunt',
  }])

  factory.define('vote', r.table('votes'), {
    ...commonFields,
    goals,
    poolId: factory.assoc('pool', 'id'),
  })

  factory.define('cycle vote', r.table('votes'), {
    ...commonFields,
    goals,
    cycleId: factory.assoc('cycle', 'id'),
  })

  // represents a vote that failed on the first attempt
  factory.define('invalid vote', r.table('votes'), {
    ...commonFields,
    poolId: factory.assoc('pool', 'id'),
  })
}
