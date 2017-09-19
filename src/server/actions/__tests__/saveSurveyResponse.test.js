/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB, useFixture} from 'src/test/helpers'
import {Response} from 'src/server/services/dataService'

import saveSurveyResponse, {_assertValidResponseValues} from '../saveSurveyResponse'

describe(testContext(__filename), function () {
  useFixture.buildOneQuestionSurvey()

  beforeEach(resetDB)

  describe('saveSurveyResponse', function () {
    describe('team relativeContribution questions (like RPC)', function () {
      beforeEach(async function () {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team', responseType: 'relativeContribution'},
          subjectIds: () => this.project.memberIds
        })
        this.currentUserId = this.project.memberIds[0]
      })

      it('saves the responses with the right attributes', async function () {
        await saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: this.project.memberIds.map(subjectId => ({subjectId, value: 25})),
        })

        const responses = await Response.run()
        expect(responses.map(({subjectId}) => subjectId).sort())
          .to.deep.equal(this.project.memberIds.sort())
        responses.forEach(response => {
          expect(response).to.have.property('surveyId', this.survey.id)
          expect(response).to.have.property('questionId', this.question.id)
          expect(response).to.have.property('respondentId', this.currentUserId)
          expect(response).to.have.property('value', 25)
        })
      })

      it('validates that the subjectIds + questionId given match a questionRef in the survey', function () {
        const valuesWithOneSubjectMissing = this.project.memberIds
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
          values: this.project.memberIds.map(subjectId => ({subjectId, value: 50})),
        })
        ).to.be.rejectedWith('Percentages must add up to 100%')
      })
    })

    describe('text responseType', function () {
      beforeEach(async function () {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'member', responseType: 'text'},
          subjectIds: () => [this.project.memberIds[1]]
        })
        this.currentUserId = this.project.memberIds[0]
      })

      it('saves the responses with the right attributes', async function () {
        await saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: [{subjectId: this.project.memberIds[1], value: 'Judy is Awesome!'}],
        })

        const responses = await Response.run()
        expect(responses.length).to.eq(1)
        expect(responses[0]).to.have.property('surveyId', this.survey.id)
        expect(responses[0]).to.have.property('questionId', this.question.id)
        expect(responses[0]).to.have.property('respondentId', this.currentUserId)
        expect(responses[0]).to.have.property('value', 'Judy is Awesome!')
        expect(responses[0].subjectId).to.eq(this.project.memberIds[1])
      })
    })

    describe('likert7Agreement responseType', function () {
      beforeEach(async function () {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'member', responseType: 'likert7Agreement'},
          subjectIds: () => [this.project.memberIds[1]]
        })
        this.currentUserId = this.project.memberIds[0]
      })

      it('saves the responses with the right attributes', async function () {
        await saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: [{subjectId: this.project.memberIds[1], value: '6'}],
        })

        const responses = await Response.run()
        expect(responses.length).to.eq(1)
        expect(responses[0]).to.have.property('surveyId', this.survey.id)
        expect(responses[0]).to.have.property('questionId', this.question.id)
        expect(responses[0]).to.have.property('respondentId', this.currentUserId)
        expect(responses[0]).to.have.property('value', 6)
        expect(responses[0].subjectId).to.eq(this.project.memberIds[1])
      })
    })

    describe('numeric responseType', function () {
      beforeEach(async function () {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'member', responseType: 'numeric', validationOptions: {min: 0}},
          subjectIds: () => [this.project.memberIds[1]]
        })
        this.currentUserId = this.project.memberIds[0]
      })

      it('saves the responses with the right attributes', async function () {
        await saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: [{subjectId: this.project.memberIds[1], value: '99'}],
        })

        const responses = await Response.run()
        expect(responses.length).to.eq(1)
        expect(responses[0]).to.have.property('surveyId', this.survey.id)
        expect(responses[0]).to.have.property('questionId', this.question.id)
        expect(responses[0]).to.have.property('respondentId', this.currentUserId)
        expect(responses[0]).to.have.property('value', 99)
        expect(responses[0].subjectId).to.eq(this.project.memberIds[1])
      })

      it('respects validationOptions', function () {
        return expect(saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: [{subjectId: this.project.memberIds[1], value: '-1'}],
        })).to.be.rejected
      })
    })

    describe('single subject relativeContribution questions', function () {
      beforeEach(async function () {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'member', responseType: 'relativeContribution'},
          subjectIds: () => [this.project.memberIds[1]]
        })
        this.currentUserId = this.project.memberIds[0]
      })

      it('saves the responses with the right attributes', async function () {
        await saveSurveyResponse({
          respondentId: this.currentUserId,
          questionId: this.question.id,
          surveyId: this.survey.id,
          values: [{subjectId: this.project.memberIds[1], value: '99'}],
        })

        const responses = await Response.run()
        expect(responses.length).to.eq(1)
        expect(responses[0]).to.have.property('surveyId', this.survey.id)
        expect(responses[0]).to.have.property('questionId', this.question.id)
        expect(responses[0]).to.have.property('respondentId', this.currentUserId)
        expect(responses[0]).to.have.property('value', 99)
        expect(responses[0].subjectId).to.eq(this.project.memberIds[1])
      })

      it('validates percentages are not bigger than 100', function () {
        return expect(
          saveSurveyResponse({
            respondentId: this.currentUserId,
            questionId: this.question.id,
            surveyId: this.survey.id,
            values: [{subjectId: this.project.memberIds[1], value: '110'}],
          })
        ).to.be.rejectedWith('must be less than or equal to 100')
      })
    })
  })

  describe('assertValidResponseValues()', function () {
    const testValues = [
      {
        responseType: 'relativeContribution',
        validValues: [0, 10, 99, 100],
        invalidValues: [-1, 'cheese', 101, null, false],
      },
      {
        responseType: 'likert7Agreement',
        validValues: [0, 1, 2, 3, 4, 5, 6, 7],
        invalidValues: [-1, 'cheese', 8, null, false],
      },
      {
        responseType: 'percentage',
        validValues: [0, 10, 99, 100],
        invalidValues: [-1, 'cheese', 101, null, false],
      },
      {
        responseType: 'numeric',
        validValues: [-10, 0, 10, 10000000],
        invalidValues: ['cheese', null, false],
      },
      {
        responseType: 'numeric',
        options: {min: 0},
        validValues: [0, 10, 99, 10000000],
        invalidValues: [-1, 'cheese', null, false],
      },
      {
        responseType: 'numeric',
        options: {min: 2, max: 8},
        validValues: [2, 5, 8],
        invalidValues: [-1, 1, 9, 'cheese', null, false],
      },
    ]

    testValues.forEach(({responseType, validValues, invalidValues, options}) => {
      const optionsDescription = options ?
        `with options: ${JSON.stringify(options)}` :
        'with no options'

      describe(`${responseType} ${optionsDescription}`, function () {
        invalidValues.forEach(value =>
          it(`rejects ${value} as invalid`, function () {
            return expect(_assertValidResponseValues([value], responseType, options))
              .to.be.rejected
          })
        )
        validValues.forEach(value =>
          it(`accepts ${value} as valid`, function () {
            return expect(_assertValidResponseValues([value], responseType, options))
              .to.be.fulfilled
          })
        )
      })
    })
  })
})
