/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {findQuestionsByStat} from 'src/server/db/question'
import {insert as insertResponses} from 'src/server/db/response'
import {Project} from 'src/server/services/dataService'
import {
  PROJECT_STATES,
  PROJECT_REVIEW_TIMEOUT_DAYS,
  PROJECT_ABANDON_TIMEOUT_DAYS,
} from 'src/common/models/project'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

import updateProjectStates from 'src/server/actions/updateProjectStates'

const {
  PROJECT_COMPLETENESS,
  PROJECT_TIME_OFF_HOURS,
} = STAT_DESCRIPTORS

const {
  REVIEW,
  CLOSED,
  ABANDONED,
} = PROJECT_STATES

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()
  const daysAgo = n => new Date(Date.now() - 86400 * 1000 * n)

  it('changes state to CLOSED if the review timeout has passed since the last external review', async function () {
    await this.saveReviews([
      {timestamp: daysAgo(PROJECT_REVIEW_TIMEOUT_DAYS + 1), external: true},
      {timestamp: daysAgo(PROJECT_REVIEW_TIMEOUT_DAYS - 1), external: false},
    ])
    await updateProjectStates(this.project.id)
    await this.expectProjectStateToBe(CLOSED)
  })

  it('changes state to ABANDONED if the abandon timeout has passed and there are no external reviews', async function () {
    await this.saveReviews([
      {timestamp: daysAgo(PROJECT_ABANDON_TIMEOUT_DAYS + 1), external: false},
    ])
    await Project.get(this.project.id).update({reviewStartedAt: daysAgo(PROJECT_ABANDON_TIMEOUT_DAYS + 1)})
    await updateProjectStates(this.project.id)
    await this.expectProjectStateToBe(ABANDONED)
  })

  it('does not change state if the review timeout has NOT passed since the last EXTERNAL review', async function () {
    await this.expectProjectStateToBe(REVIEW)
    await this.saveReviews([
      {timestamp: daysAgo(PROJECT_REVIEW_TIMEOUT_DAYS - 1), external: true},
    ])
    await updateProjectStates(this.project.id)
    await this.expectProjectStateToBe(REVIEW)
  })

  it('does not change state if the review timeout has NOT passed since the last INTERNAL review', async function () {
    await this.saveReviews([
      {timestamp: daysAgo(PROJECT_REVIEW_TIMEOUT_DAYS - 1), external: false},
    ])
    await updateProjectStates(this.project.id)
    await this.expectProjectStateToBe(REVIEW)
  })

  beforeEach(async function () {
    await reloadSurveyAndQuestionData()
    const questionIdsForStat = {
      [PROJECT_COMPLETENESS]: await getQId(PROJECT_COMPLETENESS),
      [PROJECT_TIME_OFF_HOURS]: await getQId(PROJECT_TIME_OFF_HOURS),
    }

    await this.buildSurvey(Object.values(questionIdsForStat).map(questionId => ({
      questionId, subjectIds: () => this.project.id
    })), 'projectReview')

    this.saveReviews = async reviews => {
      const responseData = []
      const internalPlayerIds = [...this.project.playerIds]

      await Promise.map(reviews, async review => {
        review = {
          [PROJECT_COMPLETENESS]: 100,
          [PROJECT_TIME_OFF_HOURS]: 38,
          ...review,
        }
        const respondentId = review.external ?
          await newExternalPlayerId() :
          internalPlayerIds.pop()

        Object.keys(questionIdsForStat).forEach(statName => {
          responseData.push({
            questionId: questionIdsForStat[statName],
            surveyId: this.survey.id,
            respondentId,
            subjectId: this.project.id,
            value: review[statName],
            updatedAt: review.timestamp || new Date(),
          })
        })
      })

      await insertResponses(responseData)
    }

    this.expectProjectStateToBe = async state => {
      const project = await Project.get(this.project.id)
      expect(project).to.have.property('state').eq(state)
    }
  })
})

function getQId(descriptor) {
  return findQuestionsByStat(descriptor).filter({active: true})(0)('id')
}

async function newExternalPlayerId() {
  const player = await factory.create('player')
  return player.id
}
