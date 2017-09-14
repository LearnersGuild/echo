/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'

import assertSurveyIsComplete from '../assertSurveyIsComplete'

console.log('useFixture inside test~~~>', useFixture)
console.log('resetDB inside test~~~>', resetDB)

describe(testContext(__filename), function () {
  useFixture.buildOneQuestionSurvey()

  beforeEach(resetDB)

  describe('when a question has a response', function () {
    beforeEach(function () {
      return this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'member', responseType: 'text'},
        subjectIds: () => [this.project.memberIds[1]]
      })
    })

    it('returns a rejected promise when a response is missing', async function () {
      expect(
        assertSurveyIsComplete(this.survey.id, this.project.memberIds[0])
      ).to.be.rejectedWith(/Missing survey responses/)
    })

    it('returns survey when all questions have been answered', async function () {
      const respondentId = this.project.memberIds[0]
      await factory.create('response', {
        respondentId,
        subjectId: this.project.memberIds[1],
        surveyId: this.survey.id,
        questionId: this.survey.questionRefs[0].questionId,
        value: 'some value',
      })
      const result = await assertSurveyIsComplete(this.survey.id, respondentId)
      expect(result.id).to.eq(this.survey.id)
    })
  })
})
