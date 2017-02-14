import faker from 'faker'

import {connect} from 'src/db'
import {CYCLE_STATES} from 'src/common/models/cycle'
import {PROJECT_DEFAULT_EXPECTED_HOURS} from 'src/common/models/project'

const r = connect()
const now = new Date()

export default function define(factory) {
  factory.define('cycle', r.table('cycles'), {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    cycleNumber: factory.sequence(n => n),
    projectDefaultExpectedHours: PROJECT_DEFAULT_EXPECTED_HOURS,
    startTimestamp: cb => cb(null, now),
    state: CYCLE_STATES[0],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
