import {PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'

import chapterCreated from './chapterCreated'
import cycleStateChanged from './cycleStateChanged'
import projectCreated from './projectCreated'
import surveySubmitted from './surveySubmitted'
import memberPhaseChanged from './memberPhaseChanged'

export default function configureChangeFeeds() {
  const queueService = require('src/server/services/queueService')

  try {
    chapterCreated(queueService.getQueue('chapterCreated'))
    cycleStateChanged({
      [PRACTICE]: queueService.getQueue('cycleLaunched'),
      [REFLECTION]: queueService.getQueue('cycleReflectionStarted'),
      [COMPLETE]: queueService.getQueue('cycleCompleted'),
    })
    projectCreated(queueService.getQueue('projectCreated'))
    surveySubmitted(queueService.getQueue('surveySubmitted'))
    memberPhaseChanged(queueService.getQueue('memberPhaseChanged'))
  } catch (err) {
    console.error(`ERROR Configuring Change Feeds: ${err.stack ? err.stack : err}`)
    throw (err)
  }
}
