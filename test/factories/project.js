import faker from 'faker'

import {connect} from 'src/db'
import {REFLECTION} from 'src/common/models/cycle'

const r = connect()
const now = new Date()

export default function define(factory) {
  const commonAttrs = {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    cycleId(cb) {
      const {chapterId} = this
      const createCycles = factory.assocMany('cycle', 'id', 1, [{chapterId, state: REFLECTION}])
      createCycles((err, cycleIds) => {
        cb(err, cycleIds[0])
      })
    },
    goal: factory.sequence(n => {
      const url = `http://example.com/repo/issue/${n}`
      const title = `Goal #${n}`
      return {
        url,
        title,
        githubIssue: {
          url,
          title,
          number: n,
        },
      }
    }),
    expectedHours: 40,
    artifactURL: factory.sequence(n => `http://artifact.example.com/${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  }

  factory.define('project', r.table('projects'), {
    ...commonAttrs,
    playerIds(cb) {
      const {chapterId} = this
      const createPlayers = factory.assocMany('player', 'id', 4, {chapterId})
      createPlayers((err, playerIds) => {
        cb(err, playerIds.slice(0, 4))
      })
    },
  })

  factory.define('single player project', r.table('projects'), {
    ...commonAttrs,
    playerIds(cb) {
      const {chapterId} = this
      const createPlayers = factory.assocMany('player', 'id', 1, {chapterId})
      createPlayers((err, playerIds) => {
        cb(err, playerIds.slice(0, 1))
      })
    },
  })
}
