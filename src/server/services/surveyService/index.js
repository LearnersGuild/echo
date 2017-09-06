import Promise from 'bluebird'
import {Question, Response} from 'src/server/services/dataService'

export default async function getFeedbackResponsesBySubjectId(subjectId) {
  const responses = await Response.filter({subjectId})

  const getFeedbackTypeDescriptor = _memoizedFeedbackTypeDescriptorFetcher()

  return Promise.mapSeries(responses, async ({respondentId, value, questionId, subjectId}) => ({
    feedbackTypeDescriptor: await getFeedbackTypeDescriptor(questionId),
    respondentId,
    value,
    subjectId,
  })).filter(response => response.feedbackTypeDescriptor !== null)
}

function _memoizedFeedbackTypeDescriptorFetcher() {
  const cache = new Map()
  return async questionId => {
    if (!cache.has(questionId)) {
      const {feedbackType} = await Question.get(questionId).getJoin({feedbackType: true})
      cache.set(questionId, feedbackType ? feedbackType.descriptor : null)
    }
    return cache.get(questionId)
  }
}
