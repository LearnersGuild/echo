/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'

import fields from '../mutation'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLMutation, useFixture} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()

  describe('saveRetrospectiveCLISurveyResponse', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team', type: 'relativeContribution'},
        subject: () => this.teamPlayerIds
      })
      this.user = await factory.build('user', {id: this.teamPlayerIds[0]})

      this.teamHandles = ['bob', 'alice', 'steve', 'shereef']
      nock(process.env.IDM_BASE_URL)
        .persist()
        .post('/graphql')
        .reply(200, JSON.stringify({
          data: {
            getUsersByIds: this.teamHandles.map(
              (handle, i) => ({handle, id: this.teamPlayerIds[i]})
            )
          }
        }))

      this.invokeAPI = function (responseParams = ['bob:25', 'alice:25', 'steve:25', 'shereef:25'], projectName) {
        return runGraphQLMutation(
          `mutation($response: CLISurveyResponse!, $projectName: String) {
            saveRetrospectiveCLISurveyResponse(response: $response, projectName: $projectName)
            {
              createdIds
            }
          }`,
          fields,
          {
            response: {
              responseParams,
              questionNumber: 1,
            },
            projectName,
          },
          {currentUser: this.user},
        )
      }
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('returns new response ids for all responses created', function () {
      return this.invokeAPI()
        .then(result => expect(result.data.saveRetrospectiveCLISurveyResponse.createdIds).have.length(4))
    })

    it('accepts a projectName param', function () {
      return this.invokeAPI(['bob:25', 'alice:25', 'steve:25', 'shereef:25'], this.project.name)
        .then(result => expect(result.data.saveRetrospectiveCLISurveyResponse.createdIds).have.length(4))
    })

    it('returns helpful error messages when missing parts', function () {
      return expect(
        this.invokeAPI(['bob:100'])
      ).to.be.rejectedWith(/Expected responses for all \d team members/)
    })

    it('returns helpful error messages for invalid values', function () {
      return expect(
        this.invokeAPI(['bob:101'])
      ).to.be.rejectedWith(/must be less than or equal to 100/)
    })
  })

  describe('saveRetrospectiveSurveyResponse', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team', type: 'relativeContribution'},
        subject: () => this.teamPlayerIds
      })
      this.user = await factory.build('user', {id: this.teamPlayerIds[0]})
      this.respondentId = this.teamPlayerIds[0]
      this.subjectId = this.teamPlayerIds[1]

      this.invokeAPI = function (rccScores) {
        const teamSize = this.teamPlayerIds.length
        rccScores = rccScores || Array(teamSize).fill(100 / teamSize)
        const values = rccScores.map((value, i) => (
          {subjectId: this.teamPlayerIds[i], value}
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
        .then(createdIds => expect(createdIds).have.length(this.teamPlayerIds.length))
    })

    it.skip('returns helpful error messages when missing parts', function () {
      return expect(
        this.invokeAPI(Array(this.teamPlayerIds.length - 1).fill(20))
      ).to.be.rejectedWith(/Expected responses for all \d team members/)
    })

    it.skip('returns helpful error messages for invalid values', function () {
      return expect(
        this.invokeAPI(Array(this.teamPlayerIds.length).fill(101))
      ).to.be.rejectedWith(/must be less than or equal to 100/)
    })
  })

  describe('saveProjectReviewResponses', function () {
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
  })
})
