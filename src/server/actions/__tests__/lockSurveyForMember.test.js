/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {useFixture} from 'src/test/helpers'
import {Survey} from 'src/server/services/dataService'

import lockSurveyForMember from '../lockSurveyForMember'

describe(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(async function () {
    await this.buildSurvey()
    this.memberId = this.project.memberIds[0]
    this.surveyId = this.project.retrospectiveSurveyId
  })

  context('when the survey has NOT been completed', function () {
    it('throws an error', function () {
      return expect(
        lockSurveyForMember(this.surveyId, this.memberId)
      ).to.be.rejectedWith(/has not been completed/)
    })
  })
  context('when the survey is completed and unlocked', function () {
    beforeEach(async function () {
      this.survey.completedBy.push(this.memberId)
      this.survey.unlockedFor = [this.memberId]
      await Survey.save(this.survey, {conflict: 'update'})
    })

    it('removed the member from the unlockedFor array', async function () {
      await lockSurveyForMember(this.surveyId, this.memberId)
      const updatedSurvey = await Survey.get(this.survey.id)
      expect(updatedSurvey.unlockedFor).to.not.include(this.memberId)
    })

    it('does not throw an error if the survey is already locked', async function () {
      await lockSurveyForMember(this.surveyId, this.memberId)
      await lockSurveyForMember(this.surveyId, this.memberId)
      const updatedSurvey = await Survey.get(this.survey.id)
      expect(updatedSurvey.unlockedFor).to.not.include(this.memberId)
    })
  })
})
