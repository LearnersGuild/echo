/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {useFixture} from 'src/test/helpers'
import {Survey} from 'src/server/services/dataService'
import {lockRetroSurveyForUser, unlockRetroSurveyForUser} from 'src/server/actions/unlockRetroSurveyForUser'

describe.only(testContext(__filename), function () {
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

      it('adds the player to the unlockedFor array only once', async function () {
        await unlockRetroSurveyForUser(this.playerId, this.projectId)
        await unlockRetroSurveyForUser(this.playerId, this.projectId)
        const updatedSurvey = await Survey.get(this.survey.id)
        const updatedSurveyOnce = updatedSurvey.unlockedFor.filter(id =>
          id === this.playerId
        ).length
        expect(updatedSurveyOnce).to.eql(1)
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
    context('when the survey is completed and unlocked', function () {
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

      it('does not throw an error if the survey is already locked', async function () {
        await lockRetroSurveyForUser(this.playerId, this.projectId)
        await lockRetroSurveyForUser(this.playerId, this.projectId)
        const updatedSurvey = await Survey.get(this.survey.id)
        expect(updatedSurvey.unlockedFor).to.not.include(this.playerId)
      })
    })
  })
})
