/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'
import {RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {Project, Question, Survey, SurveyBlueprint} from 'src/server/services/dataService'
import {resetDB, expectSetEquality} from 'src/test/helpers'
import factory from 'src/test/factories'

import {ensureRetrospectiveSurveysExist} from '../ensureCycleReflectionSurveysExist'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('ensureRetrospectiveSurveysExist', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle')
      this.createMembersAndProjects = async numMembersPerProject => {
        const numProjects = Math.min(numMembersPerProject, 2)
        const numMembersTotal = numProjects * numMembersPerProject
        this.phase = await factory.create('phase')
        this.members = await factory.createMany('member', numMembersTotal, {chapterId: this.cycle.chapterId, phaseId: this.phase.id})
        this.projects = await Promise.all(Array.from(Array(numProjects).keys()).map(i => {
          return factory.create('project', {
            chapterId: this.cycle.chapterId,
            cycleId: this.cycle.id,
            phaseId: this.phase.id,
            memberIds: this.members
              .slice(i * numMembersPerProject, i * numMembersPerProject + numMembersPerProject)
              .map(p => p.id),
          })
        }))
      }
    })

    describe('when there is a retrospective surveyBlueprint with questions', function () {
      beforeEach(async function () {
        this.surveyBlueprint = await SurveyBlueprint.filter({descriptor: RETROSPECTIVE_DESCRIPTOR}).nth(0)
        const surveyQuestionIds = this.surveyBlueprint.defaultQuestionRefs.map(({questionId}) => questionId)
        this.questions = await Question.getAll(...surveyQuestionIds)
      })

      it('creates a survey for each project team with all of the default retro questions', async function () {
        const numMembersPerProject = 4
        await this.createMembersAndProjects(numMembersPerProject)
        await ensureRetrospectiveSurveysExist(this.cycle)
        await _itBuildsTheSurveyProperly(this.projects, this.questions)
      })

      it('ignores questions with a `responseType` of `relativeContribution` for single-member teams', async function () {
        const numMembersPerProject = 1
        await this.createMembersAndProjects(numMembersPerProject)
        await ensureRetrospectiveSurveysExist(this.cycle)
        await _itBuildsTheSurveyProperly(this.projects, this.questions, {shouldIncludeRelativeContribution: false})
      })

      describe('when there are other projects in the chapter but not in this cycle', function () {
        it('ignores them', async function () {
          const projectFromAnotherCycleBefore = await factory.create('project', {chapterId: this.cycle.chapterId})
          await ensureRetrospectiveSurveysExist(this.cycle)
          const projectFromAnotherCycleAfter = await Project.get(projectFromAnotherCycleBefore.id)
          expect(projectFromAnotherCycleAfter.retrospectiveSurveyId).to.deep.eq(projectFromAnotherCycleBefore.retrospectiveSurveyId)
          expect(projectFromAnotherCycleAfter.updatedAt).to.deep.eq(projectFromAnotherCycleBefore.updatedAt)
        })
      })

      it('creates any missing surveys when run multiple times', async function () {
        const numMembersPerProject = 4
        await this.createMembersAndProjects(numMembersPerProject)
        await ensureRetrospectiveSurveysExist(this.cycle)

        const firstProject = (await Project.filter({chapterId: this.cycle.chapterId, cycleId: this.cycle.id}))[0]
        const {retrospectiveSurveyId} = firstProject
        await Project.get(firstProject.id).update({retrospectiveSurveyId: null})
        await Survey.get(retrospectiveSurveyId).delete().execute()

        await ensureRetrospectiveSurveysExist(this.cycle)
        const replacedProject = await Project.get(firstProject.id)
        expect(replacedProject.retrospectiveSurveyId).to.exist
      })
    })

    describe('when there is no retrospective surveyBlueprint', async function () {
      it('rejects the promise', async function () {
        const numMembersPerProject = 4
        await this.createMembersAndProjects(numMembersPerProject)
        await SurveyBlueprint.filter({descriptor: RETROSPECTIVE_DESCRIPTOR}).delete()
        return expect(ensureRetrospectiveSurveysExist(this.cycle)).to.be.rejected
      })
    })
  })
})

async function _itBuildsTheSurveyProperly(projects, questions, opts = null) {
  const options = opts || {shouldIncludeRelativeContribution: true}

  const teamQuestionFilter = options.shouldIncludeRelativeContribution ?
    question => question.subjectType === 'team' :
    question => question.subjectType === 'team' &&
      question.responseType !== 'relativeContribution'
  const teamQuestions = questions.filter(teamQuestionFilter)
  const memberQuestions = questions.filter(q => q.subjectType === 'member')
  const projectQuestions = questions.filter(q => q.subjectType === 'project')
  const rcQuestions = questions.filter(q => q.responseType === 'relativeContribution')

  const surveys = await Survey.run()
  expect(surveys).to.have.length(projects.length)

  const updatedProjects = await Project.getAll(...projects.map(p => p.id))
  updatedProjects.forEach(project => {
    const {memberIds, retrospectiveSurveyId, id: projectId} = project

    const survey = surveys.find(({id}) => id === retrospectiveSurveyId)
    expect(survey).to.exist

    let questionIds = questions.map(({id}) => id)
    questionIds = options.shouldIncludeRelativeContribution ?
      questionIds :
      questionIds.filter(questionId => !rcQuestions.find(rcQuestion => rcQuestion.id === questionId))

    const surveyRefIds = survey.questionRefs.map(({questionId}) => questionId)

    const refOffsets = surveyRefIds.map(refId => questionIds.indexOf(refId))
    expect(refOffsets).to.deep.equal(refOffsets.sort())

    expectSetEquality(questionIds, surveyRefIds)

    teamQuestions.forEach(question => {
      const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
      expect(refs).to.have.length(1)
      expect(refs[0].subjectIds.sort()).to.deep.eq(memberIds.sort())
    })

    const compareFirstElement = ([a], [b]) => a < b ? -1 : 1
    memberQuestions.forEach(question => {
      const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
      expect(refs).to.have.length(memberIds.length)
      expect(refs.map(ref => ref.subjectIds).sort(compareFirstElement))
       .to.deep.eq(memberIds.sort().map(id => [id]))
    })

    projectQuestions.forEach(question => {
      const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
      expect(refs).to.have.length(1)
      expect(refs[0].subjectIds.sort()).to.deep.eq([projectId])
    })

    rcQuestions.forEach(question => {
      const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
      const expectedNumRCQuestions = options.shouldIncludeRelativeContribution ? 1 : 0
      expect(refs).to.have.length(expectedNumRCQuestions)
      if (expectedNumRCQuestions > 0) {
        expect(refs[0].subjectIds.sort()).to.deep.eq(memberIds.sort())
      }
    })
  })
}
