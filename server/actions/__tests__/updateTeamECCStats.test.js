/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {getPlayerById} from '../../../server/db/player'

import {
  calculateProjectECCStatsForPlayer,
  updateTeamECCStats,
} from '../updateTeamECCStats'

describe(testContext(__filename), function () {
  describe('calculateProjectECCStatsForPlayer()', function () {
    specify('when there are scores from all team members', function () {
      expect(calculateProjectECCStatsForPlayer({teamSize: 4, relativeContributionScores: [10, 20, 20, 30]}))
        .to.deep.eq({ecc: 80, abc: 4, rc: 20})
    })
    specify('when there are not scores from all team members', function () {
      expect(calculateProjectECCStatsForPlayer({teamSize: 4, relativeContributionScores: [20, 25, 30]}))
        .to.deep.eq({ecc: 100, abc: 4, rc: 25})
    })
    specify('when the result is over 100', function () {
      expect(calculateProjectECCStatsForPlayer({teamSize: 4, relativeContributionScores: [50, 50, 50, 50]}))
        .to.deep.eq({ecc: 200, abc: 4, rc: 50})
    })
    specify('when project length is > 1', function () {
      expect(calculateProjectECCStatsForPlayer({teamSize: 4, relativeContributionScores: [50, 50, 50, 50], projectLength: 3}))
        .to.deep.eq({ecc: 600, abc: 12, rc: 50})
    })
    specify('when RC is a decimal, round', function () {
      expect(calculateProjectECCStatsForPlayer({teamSize: 5, relativeContributionScores: [10, 10, 21, 21]}))
        .to.deep.eq({ecc: 80, abc: 5, rc: 16})
    })
  })

  describe('updateTeamECCStats', function () {
    withDBCleanup()
    useFixture.buildSurvey()

    beforeEach('Setup Survey Data', async function () {
      const teamQuestion = await factory.create('question', {
        responseType: 'relativeContribution',
        subjectType: 'team'
      })
      await this.buildSurvey([
        {questionId: teamQuestion.id, subjectIds: () => this.teamPlayerIds},
      ])
      const responseData = []
      this.teamPlayerIds.forEach(respondentId => {
        this.teamPlayerIds.forEach(subjectId => {
          responseData.push({
            questionId: teamQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subjectId,
            value: 20
          })
        })
      })
      await factory.createMany('response', responseData)
    })

    it('updates the players ECC based on the survey responses', async function() {
      const eccChange = 20 * this.teamPlayerIds.length
      await updateTeamECCStats(this.project, this.cycleId)

      const updatedPlayer = await getPlayerById(this.teamPlayerIds[0])
      expect(updatedPlayer.ecc).to.eq(eccChange)
    })
  })
})
