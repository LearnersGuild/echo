/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup, expectArraysToContainTheSameElements} from 'src/test/helpers'
import {useFixture} from 'src/test/helpers/fixtures'
import {saveResponsesForSurveyQuestion, findProjectReviewsForPlayer} from 'src/server/db/response'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveResponsesForSurveyQuestion', function () {
    beforeEach(function () {
      this.buildResponse = function ({value, subjectId}) {
        return factory.build('response', {
          value,
          subjectId,
          questionId: this.question.id,
          respondentId: this.project.playerIds[0],
          surveyId: this.survey.id,
          createdAt: null,
          updatedAt: null,
        }).then(response => {
          delete response.id
          return response
        })
      }
    })

    describe('single-part subject questions', function () {
      beforeEach(async function () {
        this.project = await factory.create('project')
        this.question = await factory.create('question', {subjectType: 'player', responseType: 'text'})
        this.survey = await factory.build('survey', {
          questionRefs: [{questionId: this.question.id, subjectIds: this.project.playerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
      })

      it('saves the response', async function () {
        const responseToSave = await this.buildResponse({value: 'response value', subjectId: this.project.playerIds[1]})

        const [responseId] = await saveResponsesForSurveyQuestion([responseToSave])

        const savedResponseCount = await r.table('responses').count().run()
        expect(savedResponseCount).to.eq(1)

        const savedResponse = await r.table('responses').get(responseId).run()
        expect(savedResponse).to.have.property('createdAt').and.to.exist
        expect(savedResponse).to.have.property('updatedAt').and.to.exist

        expect(savedResponse).to.have.property('value', 'response value')
        expect(savedResponse).to.have.property('subjectId', this.project.playerIds[1])
      })

      it('overwrites previous responses for the same question + subject + survey + respondent', async function () {
        const responseForSubject1 = await this.buildResponse({value: 'response value', subjectId: this.project.playerIds[1]})
        const responseForSubject2 = await this.buildResponse({value: 'response value', subjectId: this.project.playerIds[2]})

        await saveResponsesForSurveyQuestion([responseForSubject2]) // <- this response should not get overriden
        const [responseIdAfterFirstSave] = await saveResponsesForSurveyQuestion([responseForSubject1]) // <- this one will be
        responseForSubject1.value = 'new value'
        const [responseIdAfterUpdate] = await saveResponsesForSurveyQuestion([responseForSubject1])
        expect(responseIdAfterFirstSave).to.eq(responseIdAfterUpdate)

        const savedResponseCount = await r.table('responses').count().run()
        expect(savedResponseCount).to.eq(2)

        const savedResponse = await r.table('responses').get(responseIdAfterFirstSave).run()
        expect(savedResponse).to.have.property('value', 'new value')
      })
    })

    describe('multi-part subject questions', function () {
      beforeEach(async function () {
        this.project = await factory.create('project')
        this.question = await factory.create('question', {subjectType: 'team', responseType: 'percentage'})
        this.survey = await factory.build('survey', {
          questionRefs: [{questionId: this.question.id, subjectIds: this.project.playerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)

        this.buildResponses = function (values) {
          return Promise.all(
            values.map((value, i) => {
              const subjectId = this.project.playerIds[i]
              return this.buildResponse({value, subjectId})
            })
          )
        }
      })

      it('saves multiple responses for the same question', async function () {
        const responsesToSave = await this.buildResponses([25, 25, 40, 10])

        const responseIds = await saveResponsesForSurveyQuestion(responsesToSave)

        const savedResponseCount = await r.table('responses').count().run()
        expect(savedResponseCount).to.eq(4)

        const savedResponses = await r.table('responses').getAll(...responseIds).run()
        savedResponses.forEach(response => {
          expect(response).to.have.property('createdAt').and.to.exist
          expect(response).to.have.property('updatedAt').and.to.exist
        })
        expectArraysToContainTheSameElements(savedResponses.map(r => r.value), [10, 25, 25, 40])
        expectArraysToContainTheSameElements(savedResponses.map(r => r.subjectId), this.project.playerIds)
      })

      it('overwrites previous responses for the same question', async function () {
        const responsesToSave = await this.buildResponses([25, 25, 40, 10])

        await saveResponsesForSurveyQuestion(responsesToSave)
        await saveResponsesForSurveyQuestion(responsesToSave)

        const savedResponseCount = await r.table('responses').count().run()
        expect(savedResponseCount).to.eq(4)
      })
    })
  })

  describe('findProjectReviewsForPlayer', function () {
    useFixture.createProjectReviewSurvey()

    it('finds the project reviews for the given player', async function () {
      await this.createProjectReviewSurvey()
      const user = await factory.build('user')
      const respondent = await factory.create('player', {id: user.id})
      await factory.create('response', {
        value: 85,
        subjectId: this.project.id,
        questionId: this.questionCompleteness.id,
        respondentId: user.id,
        surveyId: this.survey.id,
      })

      const reviews = await findProjectReviewsForPlayer(respondent.id)

      expect(reviews.length).to.equal(1)
      expect(reviews[0].completeness).to.equal(85)
      expect(reviews[0].projectId).to.equal(this.project.id)
      expect(reviews[0].projectName).to.equal(this.project.name)
    })
  })
})
