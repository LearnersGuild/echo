/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {Survey, Response} from 'src/server/services/dataService'

import saveSurveyResponses from '../saveSurveyResponses'
import {lockRetroSurveyForUser, unlockRetroSurveyForUser} from 'src/server/actions/unlockRetroSurveyForUser'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  beforeEach(async function () {
    await this.buildSurvey()
    this.playerId = this.project.playerIds[0]
    this.projectId = this.project.id
  })

  describe('unlockRetroSurveyForUser()', function () {
    context('when the survey has been completed', function () {
      beforeEach(async function () {
        this.survey.completedBy.push(this.playerId)
        await Survey.save(this.survey, {conflict: 'update'})
      })

      it('adds the player to the unlockedFor array', async function () {
        await unlockRetroSurveyForUser(this.playerId, this.projectId)
        const updatedSurvey = await Survey.get(this.survey.id)
        expect(updatedSurvey.unlockedFor).to.include(this.playerId)
      })
    })

    context('when the survey has NOT been completed', function () {
      it('throws an error', function () {
        return expect(
          unlockRetroSurveyForUser(this.playerId, this.projectId)
        ).to.be.rejectedWith(/incomplete/)
      })
    })
  })

  describe('lockRetroSurveyForUser()', function () {
    context('when the survey has NOT been completed', function () {
      it('throws an error', function () {
        return expect(
          lockRetroSurveyForUser(this.playerId, this.projectId)
        ).to.be.rejectedWith(/incomplete/)
      })
    })

    context('when the survey is comepleted and unlocked', function () {
      beforeEach(async function () {
        this.survey.completedBy.push(this.playerId)
        this.survey.unlockedFor = [this.playerId]
        await Survey.save(this.survey, {conflict: 'update'})
      })

      it('removes the player to the unlockedFor array', async function () {
        await lockRetroSurveyForUser(this.playerId, this.projectId)
        const updatedSurvey = await Survey.get(this.survey.id)
        expect(updatedSurvey.unlockedFor).to.not.include(this.playerId)
      })
    })
  })
})
