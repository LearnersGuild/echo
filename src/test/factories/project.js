import faker from 'faker'

import {REFLECTION} from 'src/common/models/cycle'
import {Project} from 'src/server/services/dataService'

const now = new Date()

function selectMemberIds(factory, numberOfMembers) {
  return function (cb) {
    const createMembers = factory.assocMany('member', 'id', numberOfMembers, {chapterId: this.chapterId})
    createMembers((err, memberIds) => {
      cb(err, memberIds.slice(0, numberOfMembers))
    })
  }
}

export default function define(factory) {
  const commonAttrs = {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    cycleId(cb) {
      const {chapterId} = this
      const createCycles = factory.assocMany('cycle', 'id', 1, [{chapterId, state: REFLECTION}])
      createCycles((err, cycleIds) => cb(err, cycleIds[0]))
    },
    artifactURL: factory.sequence(n => `http://artifact.example.com/${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  }

  factory.define('project', Project, {
    ...commonAttrs,
    memberIds: selectMemberIds(factory, 4)
  })

  factory.define('project with work plan', Project, {
    ...commonAttrs,
    workPlanSurveyId: cb => cb(null, faker.random.uuid()),
    memberIds: selectMemberIds(factory, 4)
  })

  factory.define('single member project', Project, {
    ...commonAttrs,
    memberIds: selectMemberIds(factory, 1)
  })
}
