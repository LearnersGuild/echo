/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import faker from 'faker'
import factory from 'src/test/factories'
import {sortByAttrs} from 'src/common/util'
import {
  expectArraysToContainTheSameElements,
  resetDB,
  useFixture
} from 'src/test/helpers'

import getFeedbackResponsesBySubjectId from '../index'

describe(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(resetDB)

  describe('getFeedbackResponsesBySubjectId()', function () {
    it('returns the response information for the feedback questions for the given subject', async function () {
      const feedbackTypes = await factory.createMany('feedbackType', [
        {descriptor: 'feedbackType1'},
        {descriptor: 'feedbackType2'},
      ])
      const questions = await factory.createMany('question', feedbackTypes.map(_ => ({feedbackTypeId: _.id})))
      const subjectId = faker.random.uuid()
      const questionRefs = feedbackTypes.map((feedbackType, i) => ({subjectIds: [subjectId], questionId: questions[i].id}))

      await this.buildSurvey({questionRefs})

      this.saveResponses = (respondentId, values) => {
        return factory.createMany('response', feedbackTypes.map((feedbackType, i) => ({
          surveyId: this.survey.id,
          value: values[i],
          questionId: questions[i].id,
          subjectId,
          respondentId,
        })))
      }

      const [p1, p2] = [faker.random.uuid(), faker.random.uuid()]
      await this.saveResponses(p1, [1, 2])
      await this.saveResponses(p2, [3, 4])

      const result = await getFeedbackResponsesBySubjectId(subjectId)

      expectArraysToContainTheSameElements(sortByAttrs(result, 'value'), sortByAttrs([
        {feedbackTypeDescriptor: 'feedbackType1', respondentId: p1, value: 1, subjectId},
        {feedbackTypeDescriptor: 'feedbackType2', respondentId: p1, value: 2, subjectId},
        {feedbackTypeDescriptor: 'feedbackType1', respondentId: p2, value: 3, subjectId},
        {feedbackTypeDescriptor: 'feedbackType2', respondentId: p2, value: 4, subjectId},
      ], 'value'))
    })
  })
})
