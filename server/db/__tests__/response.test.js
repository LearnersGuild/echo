/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, expectArraysToContainTheSameElements} from '../../../test/helpers'
import {getTeamPlayerIds, getCycleIds} from '../../../server/db/project'
import {saveResponsesForSurveyQuestion} from '../response'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveResponsesForSurveyQuestion', function () {
    beforeEach(function () {
      this.buildResponse = function ({value, subjectId}) {
        return factory.build('response', {
          value,
          subjectId,
          questionId: this.question.id,
          respondentId: this.teamPlayerIds[0],
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
        this.teamPlayerIds = getTeamPlayerIds(this.project, getCycleIds(this.project)[0])
        this.question = await factory.create('question', {subjectType: 'player', responseType: 'text'})
        this.survey = await factory.build('survey', {
          questionRefs: [{questionId: this.question.id, subjectIds: this.teamPlayerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
      })

      it('saves the response', async function () {
        const responseToSave = await this.buildResponse({value: 'response value', subjectId: this.teamPlayerIds[1]})

        const [responseId] = await saveResponsesForSurveyQuestion([responseToSave])

        const savedResponseCount = await r.table('responses').count().run()
        expect(savedResponseCount).to.eq(1)

        const savedResponse = await r.table('responses').get(responseId).run()
        expect(savedResponse).to.have.property('createdAt').and.to.exist
        expect(savedResponse).to.have.property('updatedAt').and.to.exist

        expect(savedResponse).to.have.property('value', 'response value')
        expect(savedResponse).to.have.property('subjectId', this.teamPlayerIds[1])
      })

      it('overwrites previous responses for the same question + subject + survey + respondent', async function () {
        const responseForSubject1 = await this.buildResponse({value: 'response value', subjectId: this.teamPlayerIds[1]})
        const responseForSubject2 = await this.buildResponse({value: 'response value', subjectId: this.teamPlayerIds[2]})

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
        this.teamPlayerIds = getTeamPlayerIds(this.project, getCycleIds(this.project)[0])
        this.question = await factory.create('question', {subjectType: 'team', responseType: 'percentage'})
        this.survey = await factory.build('survey', {
          questionRefs: [{questionId: this.question.id, subjectIds: this.teamPlayerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)

        this.buildResponses = function (values) {
          return Promise.all(
            values.map((value, i) => {
              const subjectId = this.teamPlayerIds[i]
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
        expectArraysToContainTheSameElements(savedResponses.map(r => r.subjectId), this.teamPlayerIds)
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
})
