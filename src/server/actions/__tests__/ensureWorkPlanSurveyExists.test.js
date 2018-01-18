/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
// import {WORK_PLAN_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
// import {Project, Survey} from 'src/server/services/dataService'
import {resetDB} from 'src/test/helpers'
import factory from 'src/test/factories'

import ensureWorkPlanSurveyExists from '../ensureWorkPlanSurveyExists'

describe(testContext(__filename), function () {
  before(resetDB)

  describe('when project input is null', function () {
    it('throws an error', function () {
      const project = null
      return expect(ensureWorkPlanSurveyExists(project)).to.be.rejectedWith('Must provide valid project input')
    })
  })

  describe('when project input is valid', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
    })

/*    describe('project does not have a workplan survey', function () {
      it('generates a new survey with an id', async function () {
        const surveyId = await ensureWorkPlanSurveyExists(this.project)
        expect(surveyId)

        // call to the db to see if workPlanSurvey.surveyId exists
          //that survey has > 0 questions
        //project has a workPlanSurveyId === surveyId
      })
    }) */
  })
})
