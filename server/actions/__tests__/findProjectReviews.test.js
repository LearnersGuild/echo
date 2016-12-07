/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'

import findProjectReviews from '../findProjectReviews'

describe(testContext(__filename), function () {
  before(truncateDBTables)

  before(async function () {
    useFixture.nockClean()
    useFixture.createProjectReviewSurvey()
    this.players = await factory.createMany('player', 5)
  })

  it('returns correct reviews for project', async function () {
    await this.createProjectReviewSurvey()

    const sortedPlayers = this.players.sort((p1, p2) => p1.id.localeCompare(p2.id))

    await Promise.mapSeries(sortedPlayers, (player, i) => {
      const response = {surveyId: this.survey.id, respondentId: player.id, subjectId: this.project.id}
      return Promise.all([
        factory.create('response', {...response, questionId: this.questionCompleteness.id, value: 80 + i}),
        factory.create('response', {...response, questionId: this.questionQuality.id, value: 90 + i}),
      ])
    })

    const reviews = await findProjectReviews(this.project.id)
    const sortedReviews = reviews.sort((r1, r2) => r1.submittedById.localeCompare(r2.submittedById))

    expect(reviews.length).to.eq(sortedPlayers.length)

    sortedReviews.forEach((review, i) => {
      expect(review.submittedById).to.eq(sortedPlayers[i].id)
      expect(review.completeness).to.eq(80 + i)
      expect(review.quality).to.eq(90 + i)
    })
  })
})
