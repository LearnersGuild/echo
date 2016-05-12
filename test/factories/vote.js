import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('vote', r.table('votes'), {
    id: cb => cb(null, faker.random.uuid()),
    playerId: factory.assoc('player', 'id'),
    cycleId: factory.assoc('cycle', 'id'),
    goals: cb => cb(null, [{
      url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/50',
      title: 'omnis nam beatae',
    }, {
      url: 'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/49',
      title: 'quia expedita nesciunt',
    }]),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
