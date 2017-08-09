/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {useFixture} from 'src/test/helpers'
import {Survey} from 'src/server/services/dataService'

import unlockSurveyForMember from '../unlockSurveyForMember'

describe(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(async function () {
    await this.buildSurvey()
    this.memberId = this.project.memberIds[0]
    this.surveyId = this.project.retrospectiveSurveyId
  })

  context('when the survey has been completed', function () {
    beforeEach(async function () {
      this.survey.completedBy.push(this.memberId)
      await Survey.save(this.survey, {conflict: 'update'})
    })

    it('adds the member to the unlockedFor array', async function () {
      await unlockSurveyForMember(this.surveyId, this.memberId)
      const updatedSurvey = await Survey.get(this.surveyId)
      expect(updatedSurvey.unlockedFor).to.include(this.memberId)
    })

    it('adds the member to the unlockedFor array only once', async function () {
      await unlockSurveyForMember(this.surveyId, this.memberId)
      await unlockSurveyForMember(this.surveyId, this.memberId)
      const updatedSurvey = await Survey.get(this.surveyId)
      const updatedSurveyCount = updatedSurvey.unlockedFor.filter(memberId => memberId === this.memberId).length
      expect(updatedSurveyCount).to.eql(1)
    })
  })

  context('when the survey has NOT been completed', function () {
    it('throws an error', function () {
      return expect(
        unlockSurveyForMember(this.surveyId, this.memberId)
      ).to.be.rejectedWith(/has not been completed/)
    })
  })
})
