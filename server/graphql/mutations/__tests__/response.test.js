/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLMutation, useFixture} from 'src/test/helpers'
import {update as updateCycle} from 'src/server/db/cycle'
import {COMPLETE, PRACTICE} from 'src/common/models/cycle'

import fields from '../index'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()
  useFixture.buildSurvey()

  describe('saveRetrospectiveSurveyResponse', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team', type: 'relativeContribution'},
        subjectIds: () => this.project.playerIds
      })
      this.user = await factory.build('user', {id: this.project.playerIds[0]})
      this.respondentId = this.project.playerIds[0]
      this.subjectId = this.project.playerIds[1]

      this.invokeAPI = function (rccScores) {
        const teamSize = this.project.playerIds.length
        rccScores = rccScores || Array(teamSize).fill(100 / teamSize)
        const values = rccScores.map((value, i) => (
          {subjectId: this.project.playerIds[i], value}
        ))

        const response = {
          values,
          questionId: this.question.id,
          surveyId: this.survey.id,
          respondentId: this.respondentId,
        }
        return runGraphQLMutation(
          `mutation($response: SurveyResponseInput!) {
            saveRetrospectiveSurveyResponse(response: $response) {
              createdIds
            }
          }`,
          fields,
          {response},
          {currentUser: this.user},
        )
      }
    })

    it('returns new response ids for all responses created in REFLECTION state', function () {
      return this.invokeAPI()
        .then(result => result.data.saveRetrospectiveSurveyResponse.createdIds)
        .then(createdIds => expect(createdIds).have.length(this.project.playerIds.length))
    })

    it('returns new response ids for all responses created in COMPLETE state', async function () {
      await updateCycle({id: this.cycleId, state: COMPLETE})
      return this.invokeAPI()
        .then(result => result.data.saveRetrospectiveSurveyResponse.createdIds)
        .then(createdIds => expect(createdIds).have.length(this.project.playerIds.length))
    })

    it('returns error message when missing parts', function () {
      return expect(
        this.invokeAPI(Array(2).fill(50))
      ).to.be.rejectedWith('Failed to save responses')
    })

    it('returns helpful error messages for invalid values', function () {
      return expect(
        this.invokeAPI(Array(this.project.playerIds.length).fill(101))
      ).to.be.rejectedWith(/must be less than or equal to 100/)
    })

    it('returns an error when the cycle is in PRACTICE state', async function () {
      await updateCycle({id: this.cycleId, state: PRACTICE})
      return expect(this.invokeAPI())
        .to.be.rejectedWith(/cycle is in the PRACTICE state/)
    })
  })

  describe('saveRetrospectiveSurveyResponses', function () {
    beforeEach(async function () {
      await this.buildSurvey()
      this.user = await factory.build('user', {id: this.project.playerIds[0]})
      this.respondentId = this.project.playerIds[0]

      this.invokeAPI = function () {
        const responses = this.project.playerIds.slice(1).map(playerId => ({
          values: [{subjectId: playerId, value: 'foo'}],
          questionId: this.surveyQuestion.id,
          surveyId: this.survey.id,
          respondentId: this.respondentId,
        }))
        return runGraphQLMutation(
          `mutation($responses: [SurveyResponseInput]!) {
            saveRetrospectiveSurveyResponses(responses: $responses) {
              createdIds
            }
          }`,
          fields,
          {responses},
          {currentUser: this.user},
        )
      }
    })

    it('returns new response ids for all responses created in REFLECTION state', function () {
      return this.invokeAPI()
        .then(result => result.data.saveRetrospectiveSurveyResponses.createdIds)
        .then(createdIds => expect(createdIds).have.length(this.project.playerIds.length - 1))
    })

    it('returns new response ids for all responses created in COMPLETE state', async function () {
      await updateCycle({id: this.cycleId, state: COMPLETE})
      return this.invokeAPI()
        .then(result => result.data.saveRetrospectiveSurveyResponses.createdIds)
        .then(createdIds => expect(createdIds).have.length(this.project.playerIds.length - 1))
    })

    it('returns an error when in PRACTICE state', async function () {
      await updateCycle({id: this.cycleId, state: PRACTICE})
      return expect(this.invokeAPI())
        .to.be.rejectedWith(/cycle is in the PRACTICE state/)
    })
  })
})
