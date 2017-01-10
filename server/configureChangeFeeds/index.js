import {GOAL_SELECTION, PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'

import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleStateChanged from './cycleStateChanged'
import projectArtifactChanged from './projectArtifactChanged'
import surveyResponseSubmitted from './surveyResponseSubmitted'

export default function configureChangeFeeds() {
  const queueService = require('src/server/services/queueService')

  try {
    newChapters(queueService.getQueue('newChapter'))
    newOrUpdatedVotes(queueService.getQueue('newOrUpdatedVote'))
    surveyResponseSubmitted(queueService.getQueue('surveyResponseSubmitted'))
    cycleStateChanged({
      [GOAL_SELECTION]: queueService.getQueue('cycleInitialized'),
      [PRACTICE]: queueService.getQueue('cycleLaunched'),
      [REFLECTION]: queueService.getQueue('cycleReflectionStarted'),
      [COMPLETE]: queueService.getQueue('cycleCompleted'),
    })
    projectArtifactChanged(queueService.getQueue('projectArtifactChanged'))
  } catch (err) {
    console.error(`ERROR Configuring Change Feeds: ${err.stack ? err.stack : err}`)
    throw (err)
  }
}
