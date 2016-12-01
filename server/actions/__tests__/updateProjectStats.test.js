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

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  it('updates the project record', async function () {
    await this.saveReviews([
      {completeness: 50, quality: 60},
      {completeness: 40, quality: 60},
      {completeness: 30, quality: 30},
    ])
    await updateProjectStats(this.project.id)
    await this.expectProjectStatsAfterUpdateToEqual({completeness: 40, quality: 50})
  })

  it('includes external reviews', async function () {
    await this.saveReviews([
      {completeness: 50, quality: 60},
      {completeness: 40, quality: 60},
      {completeness: 30, quality: 30, external: true},
    ])
    await updateProjectStats(this.project.id)
    await this.expectProjectStatsAfterUpdateToEqual({completeness: 40, quality: 50})
  })

  it('promise not rejected if no responses exist', function () {
    const promise = updateProjectStats(this.project.id)
    return expect(promise).to.not.be.rejected
  })

  beforeEach(function () {
    this.saveReviews = async reviews => {
      await reloadSurveyAndQuestionData()

      const questions = {
        completeness: await getQId(STAT_DESCRIPTORS.PROJECT_COMPLETENESS),
        quality: await getQId(STAT_DESCRIPTORS.PROJECT_QUALITY),
      }

      await this.buildSurvey(Object.values(questions).map(q => ({
        ...q, subjectIds: () => this.project.id
      })), 'projectReview')

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
