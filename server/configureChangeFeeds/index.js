import {GOAL_SELECTION, PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'
import {getQueue} from 'src/server/services/queueService'

import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleStateChanged from './cycleStateChanged'
import projectArtifactChanged from './projectArtifactChanged'
import surveyResponseSubmitted from './surveyResponseSubmitted'

export default function configureChangeFeeds() {
  try {
    newChapters(getQueue('newChapter'))
    newOrUpdatedVotes(getQueue('newOrUpdatedVote'))
    surveyResponseSubmitted(getQueue('surveyResponseSubmitted'))
    cycleStateChanged({
      [GOAL_SELECTION]: getQueue('cycleInitialized'),
      [PRACTICE]: getQueue('cycleLaunched'),
      [REFLECTION]: getQueue('cycleReflectionStarted'),
      [COMPLETE]: getQueue('cycleCompleted'),
    })
    projectArtifactChanged(getQueue('projectArtifactChanged'))
  } catch (err) {
    console.error(`ERROR Configuring Change Feeds: ${err.stack ? err.stack : err}`)
    throw (err)
  }
}
