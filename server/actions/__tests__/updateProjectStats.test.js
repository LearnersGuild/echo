/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {findQuestionsByStat} from 'src/server/db/question'
import {insert as insertResponses} from 'src/server/db/response'
import {getProjectById} from 'src/server/db/project'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

import updateProjectStats from 'src/server/actions/updateProjectStats'

const {
  PROJECT_COMPLETENESS,
  PROJECT_QUALITY,
  PROJECT_HOURS,
  PROJECT_TIME_OFF_HOURS,
} = STAT_DESCRIPTORS

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  it('updates the project record', async function () {
    await this.saveReviews([
      {[PROJECT_COMPLETENESS]: 50, [PROJECT_QUALITY]: 60, [PROJECT_TIME_OFF_HOURS]: 28},
      {[PROJECT_COMPLETENESS]: 40, [PROJECT_QUALITY]: 60, [PROJECT_TIME_OFF_HOURS]: 18},
      {[PROJECT_COMPLETENESS]: 30, [PROJECT_QUALITY]: 30, [PROJECT_TIME_OFF_HOURS]: 8},
    ])
    await updateProjectStats(this.project.id)
    await this.expectProjectStatsAfterUpdateToEqual({
      [PROJECT_COMPLETENESS]: 40,
      [PROJECT_QUALITY]: 50,
      [PROJECT_HOURS]: 60
    })
  })

  it('includes external reviews', async function () {
    await this.saveReviews([
      {[PROJECT_COMPLETENESS]: 50, [PROJECT_QUALITY]: 60, [PROJECT_TIME_OFF_HOURS]: 33},
      {[PROJECT_COMPLETENESS]: 40, [PROJECT_QUALITY]: 60, [PROJECT_TIME_OFF_HOURS]: 32},
      {[PROJECT_COMPLETENESS]: 30, [PROJECT_QUALITY]: 30, [PROJECT_TIME_OFF_HOURS]: 31, external: true},
    ])
    await updateProjectStats(this.project.id)
    await this.expectProjectStatsAfterUpdateToEqual({
      [PROJECT_COMPLETENESS]: 40,
      [PROJECT_QUALITY]: 50,
      [PROJECT_HOURS]: 18
    })
  })

  it('promise not rejected if no responses exist', function () {
    const promise = updateProjectStats(this.project.id)
    return expect(promise).to.not.be.rejected
  })

  beforeEach(async function () {
    await reloadSurveyAndQuestionData()
    const questions = {
      [PROJECT_COMPLETENESS]: await getQId(PROJECT_COMPLETENESS),
      [PROJECT_QUALITY]: await getQId(PROJECT_QUALITY),
      [PROJECT_TIME_OFF_HOURS]: await getQId(PROJECT_TIME_OFF_HOURS),
    }

    await this.buildSurvey(Object.values(questions).map(q => ({
      ...q, subjectIds: () => this.project.id
    })), 'projectReview')

    this.saveReviews = async reviews => {
      const responseData = []
      const internalPlayerIds = [...this.project.playerIds]

      await Promise.map(reviews, async review => {
        const respondentId = review.external ?
          await newExternalPlayerId() :
          internalPlayerIds.pop()

        Object.keys(questions).forEach(name => {
          responseData.push({
            questionId: questions[name],
            surveyId: this.survey.id,
            respondentId,
            subjectId: this.project.id,
            value: review[name],
          })
        })
      })

      await insertResponses(responseData)
    }

    this.expectProjectStatsAfterUpdateToEqual = async stats => {
      const project = await getProjectById(this.project.id)
      expect(project.stats).to.deep.eq(stats)
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
