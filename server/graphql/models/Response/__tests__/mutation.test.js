/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import fields from '../mutation'
import factory from '../../../../../test/factories'
import {update as updateCycle} from '../../../../../server/db/cycle'
import {COMPLETE} from '../../../../../common/models/cycle'
import {withDBCleanup, runGraphQLMutation, useFixture} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()

  describe('saveRetrospectiveSurveyResponse', function () {
    beforeEach(async function () {
      await this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'team', type: 'relativeContribution'},
        subjectIds: () => this.teamPlayerIds
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

    it('returns error message when missing parts', function () {
      return expect(
        this.invokeAPI(Array(2).fill(50))
      ).to.be.rejectedWith('Failed to save responses')
    })

    it('returns helpful error messages for invalid values', function () {
      return expect(
        this.invokeAPI(Array(this.teamPlayerIds.length).fill(101))
      ).to.be.rejectedWith(/must be less than or equal to 100/)
    })

    describe('when the cycle is not in reflection', function () {
      beforeEach(async function () {
        await updateCycle({id: this.cycleId, state: COMPLETE})
      })

      it('returns an error', function () {
        return expect(this.invokeAPI())
          .to.be.rejectedWith(/cycle is not in the "reflection" state/)
      })
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

    describe('when the cycle is not in reflection', function () {
      beforeEach(async function () {
        await updateCycle({id: this.cycle.id, state: COMPLETE})
      })

      it('returns an error', function () {
        return expect(this.invokeAPI())
          .to.be.rejectedWith(/cycle is not in the "reflection" state/)
      })
    })
  })
})
