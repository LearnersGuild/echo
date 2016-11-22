import faker from 'faker'

import {connect} from 'src/db'

const r = connect()
const now = new Date()

export default function define(factory) {
  factory.define('pool', r.table('pools'), {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `pool${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
