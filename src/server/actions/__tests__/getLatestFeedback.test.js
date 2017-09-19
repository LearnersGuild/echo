/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint array-callback-return: "off" */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import FEEDBACK_TYPE_DESCRIPTORS from 'src/common/models/feedbackType'

import getLatestFeedback from '../getLatestFeedback'

const {TECHNICAL_COMPREHENSION, CULTURE_CONTRIBUTION, TEAM_PLAY} = FEEDBACK_TYPE_DESCRIPTORS

describe(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(resetDB)

  beforeEach('Setup Survey Data', async function () {
    this.feedbackTypes = {}
    this.feedbackQuestions = {}

    const feedbackTypeDescriptors = [
      TECHNICAL_COMPREHENSION,
      TEAM_PLAY,
    ]

    await Promise.all(
      Object.values(feedbackTypeDescriptors).map(async descriptor => {
        this.feedbackTypes[descriptor] = await factory.create('feedbackType', {descriptor})
      })
    )

    await Promise.all(feedbackTypeDescriptors.map(feedbackTypeDescriptor =>
      factory.create('question', {
        responseType: 'likert7Agreement',
        subjectType: 'member',
        feedbackTypeId: this.feedbackTypes[feedbackTypeDescriptor].id,
      }).then(q => {
        this.feedbackQuestions[feedbackTypeDescriptor] = q
      })
    ))

    await this.buildSurvey({
      questionRefs: feedbackTypeDescriptors.map(feedbackTypeDescriptor => ({
        questionId: this.feedbackQuestions[feedbackTypeDescriptor].id,
        subjectIds: () => this.project.memberIds
      }))
    })

    const [subjectId, respondentId] = this.project.memberIds
    this.subjectId = subjectId
    this.respondentId = respondentId
  })

  it('returns the response values converted to a 0-100 scale', async function () {
    await _createResponses(this, {[TECHNICAL_COMPREHENSION]: 3, [CULTURE_CONTRIBUTION]: 7, [TEAM_PLAY]: 6})
    return expect(getLatestFeedback({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq({
      [TECHNICAL_COMPREHENSION]: 33,
      [TEAM_PLAY]: 83,
    })
  })

  it('returns undefined when no feedback available', function () {
    return expect(getLatestFeedback({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq(undefined)
  })

  it('returns undefined when feedback is "not enough information"', async function () {
    await _createResponses(this, {[TECHNICAL_COMPREHENSION]: 0, [CULTURE_CONTRIBUTION]: 0, [TEAM_PLAY]: 0})
    const result = await getLatestFeedback({subjectId: this.subjectId, respondentId: this.respondentId})
    expect(result[TECHNICAL_COMPREHENSION]).to.be.undefined
    expect(result[TEAM_PLAY]).to.be.undefined
  })

  it('returns undefined for individual feedback types if they\'re nor available', async function () {
    await _createResponses(this, {[TEAM_PLAY]: 3})
    return expect(getLatestFeedback({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq({[TEAM_PLAY]: 33})
  })
})

function _createResponses(test, values) {
  const {
    respondentId,
    subjectId,
    feedbackQuestions,
  } = test

  const surveyId = test.survey.id

  const responses = []

  Object.keys(feedbackQuestions).forEach(feedbackTypeDescriptor => {
    if ({}.hasOwnProperty.call(values, feedbackTypeDescriptor)) {
      responses.push({
        questionId: feedbackQuestions[feedbackTypeDescriptor].id, surveyId, respondentId, subjectId, value: values[feedbackTypeDescriptor]
      })
    }
  })

  return factory.createMany('response', responses)
}
