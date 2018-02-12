/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'

import r from '../../r'
import getSurveyForMember from '../getSurveyForMember'

describe(testContext(__filename), function () {
  useFixture.buildSurvey()
  useFixture.buildOneQuestionSurvey()

  beforeEach(resetDB)

  describe('when the member is only on one project', function () {
    beforeEach(function () {
      return this.buildSurvey()
    })

    it('returns the correct survey with projectId added when no projectId specified', async function () {
      const survey = await getSurveyForMember(this.project.memberIds[0], null, RETROSPECTIVE_DESCRIPTOR)
      expect(survey).to.have.property('id', this.survey.id)
      expect(survey).to.have.property('projectId')
    })

    it('returns the correct survey with projectId added when projectId given explicitly', async function () {
      const survey = await getSurveyForMember(this.project.memberIds[0], this.project.id, RETROSPECTIVE_DESCRIPTOR)
      expect(survey).to.have.property('id', this.survey.id)
      expect(survey).to.have.property('projectId')
    })

    it('excludes questions about the respondent', function () {
      return getSurveyForMember(this.project.memberIds[0], null, RETROSPECTIVE_DESCRIPTOR)
        .then(result => {
          expect(result.questionRefs).to.have.length(this.project.memberIds.length - 1)
          expect(result.questionRefs.map(ref => ref.subjectIds)).not.to.include(this.project.memberIds[0])
        })
    })
  })

  describe('when the member is on multiple projects', function () {
    beforeEach(async function () {
      const project1 = await factory.create('project')
      const project2 = await factory.create('project', {cycleId: project1.cycleId, memberIds: project1.memberIds})
      const project3 = await factory.create('project')
      this.projects = [project1, project2, project3]

      const question = await factory.create('question')
      this.surveys = await factory.createMany('survey', 2, {
        questionRefs: [{subjectIds: [project1.memberIds[0]], questionId: question.id}]
      })

      await r.table('projects').get(project1.id).update({retrospectiveSurveyId: this.surveys[0].id})
      await r.table('projects').get(project2.id).update({retrospectiveSurveyId: this.surveys[1].id})
    })

    it('returns the correct survey', async function () {
      const memberId = this.projects[0].memberIds[0]
      const survey0 = await getSurveyForMember(memberId, this.projects[0].id, RETROSPECTIVE_DESCRIPTOR)
      const survey1 = await getSurveyForMember(memberId, this.projects[1].id, RETROSPECTIVE_DESCRIPTOR)
      expect(survey0).to.have.property('id', this.surveys[0].id)
      expect(survey1).to.have.property('id', this.surveys[1].id)
    })

    it('raises an error if member not working on the specified project', function () {
      return expect(
        getSurveyForMember(this.projects[0].memberIds[0], this.projects[2].id, RETROSPECTIVE_DESCRIPTOR)
      ).to.be.rejectedWith('Member not on the team')
    })

    it('raises an error if no projectId provided', function () {
      return expect(
        getSurveyForMember(this.projects[0].memberIds[0], null, RETROSPECTIVE_DESCRIPTOR)
      ).to.be.rejectedWith('Multiple projects found')
    })
  })
})
