import FEEDBACK_TYPE_DESCRIPTORS from 'src/common/models/feedbackType'
import {findLatestFeedbackResponses} from 'src/server/services/dataService'
import {likert7Average, LIKERT_SCORE_NA} from 'src/server/util/feedback'

export default async function getLatestFeedback({respondentId, subjectId}) {
  const latestResponses = await findLatestFeedbackResponses({respondentId, subjectId})
  if (latestResponses.length === 0) {
    return
  }

  return [
    FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY,
    FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION,
  ].reduce((result, feedbackType) => {
    const response = latestResponses.find(response => response.feedbackTypeDescriptor === feedbackType)
    if (response && response.value !== LIKERT_SCORE_NA) {
      result[feedbackType] = likert7Average([response.value])
    }
    return result
  }, {})
}
