/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture, mockIdmUsersById} from 'src/test/helpers'

// FIXME: this is horrible -- result of the Slack migration
import {_saveReview} from 'src/server/cliCommand/commands/review'

import fields from '../index'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  describe('Retrospective queries', function () {
    beforeEach('Setup Retrospective Survey Data', async function () {
      const teamQuestion = await factory.create('question', {
        responseType: 'relativeContribution',
        subjectType: 'team'
      })
      const playerQuestion = await factory.create('question', {
        body: 'What is one thing {{subject}} did well?',
        responseType: 'text',
        subjectType: 'player'
      })
      await this.buildSurvey([
        {questionId: teamQuestion.id, subjectIds: () => this.project.playerIds},
        {questionId: playerQuestion.id, subjectIds: () => [this.project.playerIds[1]]},
      ])
      this.currentUser = await factory.build('user', {id: this.project.playerIds[0]})

      await mockIdmUsersById(this.project.playerIds)
    })

    afterEach(function () {
      nock.cleanAll()
    })

    describe('getRetrospectiveSurveyQuestion', function () {
      it('gets a single question from the survey by index', function () {
        const questionNumber = 2 // <-- 1-based arg
        const questionIndex = 1 // <-- 0-based index

        return runGraphQLQuery(
          `query($questionNumber: Int!) {
            getRetrospectiveSurveyQuestion(questionNumber: $questionNumber) {
              id subjectType responseType body
              subjects { id name handle }
            }
          }
          `,
          fields,
          {questionNumber},
          {currentUser: this.currentUser}
        ).then(result =>
          expect(result.data.getRetrospectiveSurveyQuestion)
            .to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
        )
      })

      it('accepts a projectName parameter', function () {
        const questionNumber = 2 // <-- 1-based arg
        const questionIndex = 1 // <-- 0-based index

        return runGraphQLQuery(
          `query($questionNumber: Int!, $projectName: String) {
            getRetrospectiveSurveyQuestion(questionNumber: $questionNumber, projectName: $projectName) {
              id
            }
          }
          `,
          fields,
          {questionNumber, projectName: this.project.name},
          {currentUser: this.currentUser}
        ).then(result =>
          expect(result.data.getRetrospectiveSurveyQuestion)
            .to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
        )
      })
    })

    describe('getRetrospectiveSurvey', function () {
      it('returns the survey for the correct cycle and project for the current user', function () {
        return runGraphQLQuery(
          `query {
            getRetrospectiveSurvey {
              id
              project {
                id
                name
                chapter { id name }
                cycle { id cycleNumber }
              }
              questions {
                id subjectType responseType body
                subjects { id name handle }
                response {
                  values {
                    subjectId
                    value
                  }
                }
              }
            }
          }
          `,
          fields,
          undefined,
          {currentUser: this.currentUser}
        ).then(result => {
          expect(result.data.getRetrospectiveSurvey.id).to.eq(this.survey.id)
          expect(result.data.getRetrospectiveSurvey.project.name).to.eq(this.project.name)
          expect(result.data.getRetrospectiveSurvey.project.cycle.id).to.eq(this.cycleId)
          expect(result.data.getRetrospectiveSurvey.project.cycle.cycleNumber).to.exist
          expect(result.data.getRetrospectiveSurvey.project.chapter.id).to.eq(this.project.chapterId)
          expect(result.data.getRetrospectiveSurvey.project.chapter.name).to.exist
        })
      })

      it('treats the question body like a template', function () {
        return runGraphQLQuery(
          `query {
            getRetrospectiveSurvey {
              questions {
                body
                subjects { handle }
              }
            }
          }
          `,
          fields,
          undefined,
          {currentUser: this.currentUser}
        )
        .then(result => {
          const question = result.data.getRetrospectiveSurvey.questions[1]
          expect(question.body).to.contain(`@${question.subjects[0].handle}`)
        })
      })

      it('accepts a projectName parameter', function () {
        return runGraphQLQuery(
          `query($projectName: String) {
            getRetrospectiveSurvey(projectName: $projectName) { id }
          }
          `,
          fields,
          {projectName: this.project.name},
          {currentUser: this.currentUser}
        ).then(result =>
          expect(result.data.getRetrospectiveSurvey.id).to.eq(this.survey.id)
        )
      })

      it('returns a meaningful error when lookup fails', function () {
        return r.table('surveys').get(this.survey.id).delete()
          .then(() => expect(
            runGraphQLQuery('query { getRetrospectiveSurvey { id } }',
              fields,
              undefined,
              {currentUser: this.currentUser}
            )
          ).to.be.rejectedWith(/no retrospective survey/))
      })
    })
  })
  describe('Project Review Queries', function () {
    useFixture.createProjectReviewSurvey()

    beforeEach('Setup Project Review Survey Data', async function () {
      await this.createProjectReviewSurvey()
      const player = await factory.create('player')
      this.currentUser = await factory.build('user', {id: player.id})

      this.invokeAPI = () => runGraphQLQuery(
        `query($projectName: String!) {
          getProjectReviewSurveyStatus(projectName: $projectName) {
            project { artifactURL }
            completed
            responses {
              questionName
              values { subjectId value }
            }
          }
        }`,
        fields,
        {projectName: this.project.name},
        {currentUser: this.currentUser}
      )
    })

    describe('when player has not started the review', function () {
      it('returns the status showing no progress', function () {
        return this.invokeAPI().then(result => {
          const status = result.data.getProjectReviewSurveyStatus
          expect(status).to.deep.eq({
            completed: false,
            project: {
              artifactURL: this.project.artifactURL
            },
            responses: [],
          })
        })
      })
    })

    describe('when player has completed the review', function () {
      beforeEach(function () {
        const responses = [
          {questionName: 'completeness', responseParams: ['8']},
        ]
        const projectName = this.project.name
        return _saveReview(this.currentUser, projectName, responses)
      })

      it('returns the status showing the completed review', function () {
        return this.invokeAPI().then(result => {
          const status = result.data.getProjectReviewSurveyStatus
          expect(status).to.deep.eq({
            completed: true,
            project: {
              artifactURL: this.project.artifactURL
            },
            responses: [
              {questionName: 'completeness', values: [{subjectId: this.project.id, value: '8'}]},
            ],
          })
        })
      })
    })
  })
})
