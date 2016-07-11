/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import r from '../../../db/connect'
import {withDBCleanup, useFixture} from '../../../test/helpers'

import saveSurveyResponse from '../saveSurveyResponse'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()

  describe('team relativeContribution questions (like RPC)', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team', responseType: 'relativeContribution'},
        subjectIds: () => this.teamPlayerIds
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        values: this.teamPlayerIds.map(subjectId => ({subjectId, value: 25})),
      })

      const responses = await r.table('responses').run()
      expect(responses.map(({subjectId}) => subjectId).sort())
        .to.deep.equal(this.teamPlayerIds.sort())
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('questionId', this.question.id)
        expect(response).to.have.property('respondentId', this.currentUserId)
        expect(response).to.have.property('value', 25)
      })
    })

    it('validates that the subjectIds + questionId given match a questionRef in the survey', function () {
      const valuesWithOneSubjectMissing = this.teamPlayerIds
        .slice(1)
        .map(subjectId => ({subjectId, value: 25}))

      return expect(
        saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: valuesWithOneSubjectMissing,
        })
      ).to.be.rejectedWith('Matching QuestionRef Not Found')
    })

    it('validates percentages add up to 100', function () {
      return expect(
       saveSurveyResponse({
         respondentId: this.currentUserId,
         questionId: this.question.id,
         surveyId: this.survey.id,
         values: this.teamPlayerIds.map(subjectId => ({subjectId, value: 50})),
       })
      ).to.be.rejectedWith('Percentages must add up to 100%')
    })
  })

  describe('text responseType', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'text'},
        subjectIds: () => [this.teamPlayerIds[1]]
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        values: [{subjectId: this.teamPlayerIds[1], value: 'Judy is Awesome!'}],
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(1)
      expect(responses[0]).to.have.property('surveyId', this.survey.id)
      expect(responses[0]).to.have.property('questionId', this.question.id)
      expect(responses[0]).to.have.property('respondentId', this.currentUserId)
      expect(responses[0]).to.have.property('value', 'Judy is Awesome!')
      expect(responses[0].subjectId).to.eq(this.teamPlayerIds[1])
    })
  })

  describe('likert7Agreement responseType', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'likert7Agreement'},
        subjectIds: () => [this.teamPlayerIds[1]]
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        values: [{subjectId: this.teamPlayerIds[1], value: '6'}],
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(1)
      expect(responses[0]).to.have.property('surveyId', this.survey.id)
      expect(responses[0]).to.have.property('questionId', this.question.id)
      expect(responses[0]).to.have.property('respondentId', this.currentUserId)
      expect(responses[0]).to.have.property('value', 6)
      expect(responses[0].subjectId).to.eq(this.teamPlayerIds[1])
    })
  })

  describe('single subject relativeContribution questions', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'relativeContribution'},
        subjectIds: () => [this.teamPlayerIds[1]]
      })
      this.currentUserId = this.teamPlayerIds[0]
    })

    it('saves the responses with the right attributes', async function () {
      await saveSurveyResponse({
        respondentId: this.currentUserId,
        questionId: this.question.id,
        surveyId: this.survey.id,
        values: [{subjectId: this.teamPlayerIds[1], value: '99'}],
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(1)
      expect(responses[0]).to.have.property('surveyId', this.survey.id)
      expect(responses[0]).to.have.property('questionId', this.question.id)
      expect(responses[0]).to.have.property('respondentId', this.currentUserId)
      expect(responses[0]).to.have.property('value', 99)
      expect(responses[0].subjectId).to.eq(this.teamPlayerIds[1])
    })

    it('validates percentages are not bigger than 100', function () {
      return expect(
        saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: [{subjectId: this.teamPlayerIds[1], value: '110'}],
        })
      ).to.be.rejectedWith('must be less than or equal to 100')
    })
  })
})
