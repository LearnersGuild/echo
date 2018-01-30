import faker from 'faker'

import {Phase} from 'src/server/services/dataService'

const now = new Date()

export default function define(factory) {
  factory.define('phase', Phase, {
    id: cb => cb(null, faker.random.uuid()),
    number: factory.sequence(n => n),
    name: factory.sequence(n => `phase-name-${n}`),
    channelName: factory.sequence(n => `phase-${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
