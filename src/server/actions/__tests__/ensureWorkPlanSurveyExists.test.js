/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
// import {WORK_PLAN_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
// import {Project, Survey} from 'src/server/services/dataService'
import {resetDB} from 'src/test/helpers'
import factory from 'src/test/factories'
import {Project, Survey} from 'src/server/services/dataService'

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

    describe('project does not have a work plan survey', function () {
      it('generates a new survey with an id', async function () {
        const workPlanSurveyId = await ensureWorkPlanSurveyExists(this.project)
        const workPlanSurvey = await Survey.get(workPlanSurveyId)
        const updatedProject = await Project.get(this.project.id)
        expect(updatedProject.workPlanSurveyId).to.eq(workPlanSurvey.id)
      })
    })

    describe('project does already have a work plan survey', function () {
      it('throws an error', async function () {
        await ensureWorkPlanSurveyExists(this.project)
        return expect(
          ensureWorkPlanSurveyExists(this.project)
        ).to.be.rejectedWith(/survey already exists/)
      })
    })
  })
})
