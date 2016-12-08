/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLMutation, useFixture} from 'src/test/helpers'
import {update as updateCycle} from 'src/server/db/cycle'
import {COMPLETE} from 'src/common/models/cycle'

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

    it('returns new response ids for all responses created', function () {
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

    describe('when the cycle is not in reflection', function () {
      beforeEach(async function () {
        await updateCycle({id: this.cycleId, state: COMPLETE})
      })

      it('returns an error', function () {
        return expect(this.invokeAPI())
          .to.be.rejectedWith(/cycle is not in the REFLECTION state/)
      })
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

    it('returns new response ids for all responses created', function () {
      return this.invokeAPI()
        .then(result => result.data.saveRetrospectiveSurveyResponses.createdIds)
        .then(createdIds => expect(createdIds).have.length(this.project.playerIds.length - 1))
    })

    describe('when the cycle is not in reflection', function () {
      beforeEach(async function () {
        await updateCycle({id: this.cycleId, state: COMPLETE})
      })

      it('returns an error', function () {
        return expect(this.invokeAPI())
          .to.be.rejectedWith(/cycle is not in the REFLECTION state/)
      })
    })
  })

  describe('saveProjectReviewCLISurveyResponses', function () {
    useFixture.createProjectReviewSurvey()

    beforeEach(async function () {
      await this.createProjectReviewSurvey()
      const player = await factory.create('player', {chapterId: this.cycle.chapterId})
      this.user = await factory.build('user', {id: player.id})

      this.invokeAPI = function (projectName = this.project.name, responses) {
        responses = responses || [
          {questionName: 'A', responseParams: ['80']},
          {questionName: 'B', responseParams: ['75']},
        ]
        return runGraphQLMutation(
          `mutation($projectName: String!, $responses: [CLINamedSurveyResponse]!) {
            saveProjectReviewCLISurveyResponses(projectName: $projectName, responses: $responses)
            {
              createdIds
            }
          }`,
          fields,
          {projectName, responses},
          {currentUser: this.user},
        )
      }
    })

    it('returns new response ids for all responses created', function () {
      return this.invokeAPI()
        .then(result => expect(result.data.saveProjectReviewCLISurveyResponses.createdIds).have.length(2))
    })

    it('returns helpful error messages for invalid values', function () {
      return expect(
        this.invokeAPI(this.project.name, [{questionName: 'A', responseParams: ['101']}])
      ).to.be.rejectedWith(/must be less than or equal to 100/)
    })

    describe('when the cycle is not in reflection', function () {
      beforeEach(async function () {
        await updateCycle({id: this.cycle.id, state: COMPLETE})
      })

      it('returns an error', function () {
        return expect(this.invokeAPI())
          .to.be.rejectedWith(/cycle is not in the REFLECTION state/)
      })
    })
  })
})
