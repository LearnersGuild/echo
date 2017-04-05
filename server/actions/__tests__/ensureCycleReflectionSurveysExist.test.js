/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'
import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup, expectSetEquality} from 'src/test/helpers'
import {table as projectsTable, getProjectById, findProjects} from 'src/server/db/project'
import {getSurveyById} from 'src/server/db/survey'
import {PROJECT_REVIEW_DESCRIPTOR, RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {
  ensureProjectReviewSurveysExist,
  ensureRetrospectiveSurveysExist,
} from 'src/server/actions/ensureCycleReflectionSurveysExist'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('ensureProjectReviewSurveysExist', function () {
    beforeEach(async function () {
      const numProjects = 2
      const numPlayersPerProject = 4
      const numPlayersTotal = numProjects * numPlayersPerProject
      this.cycle = await factory.create('cycle')
      this.players = await factory.createMany('player', {chapterId: this.cycle.chapterId}, numPlayersTotal)
      this.projects = await Promise.all(Array.from(Array(numProjects).keys()).map(i => {
        const playerSliceStart = i * numPlayersPerProject
        const playerSliceEnd = (i * numPlayersPerProject) + numPlayersPerProject
        return factory.create('project', {
          chapterId: this.cycle.chapterId,
          cycleId: this.cycle.id,
          playerIds: this.players.slice(playerSliceStart, playerSliceEnd).map(p => p.id),
        })
      }))
    })

    describe('when there is a projectReview surveyBlueprint with questions', function () {
      beforeEach(async function () {
        this.questions = await factory.createMany('question', {
          subjectType: 'project',
          responseType: 'percentage'
        }, 1)
        this.surveyBlueprint = await factory.create('surveyBlueprint', {
          descriptor: PROJECT_REVIEW_DESCRIPTOR,
          defaultQuestionRefs: [
            {name: 'completeness', questionId: this.questions[0].id},
          ]
        })
      })

      it('creates a survey for each project with all of the default questions', async function () {
        await ensureProjectReviewSurveysExist(this.cycle)

        const surveys = await r.table('surveys').run()
        expect(surveys).to.have.length(this.projects.length)

        const updatedProjects = await projectsTable.getAll(...this.projects.map(p => p.id))
        await Promise.each(updatedProjects, async project => {
          const reviewSurvey = await r.table('surveys').get(project.projectReviewSurveyId)
          expect(reviewSurvey).to.exist
          expectSetEquality(
            reviewSurvey.questionRefs.map(({questionId}) => questionId),
            this.questions.map(({id}) => id),
          )
          reviewSurvey.questionRefs.forEach(ref => expect(ref).to.have.property('name'))
          const projectIsSubjectOfEveryQuestion = reviewSurvey.questionRefs.every(survey => (
            survey.subjectIds.length === 1 && survey.subjectIds[0] === project.id
          ))
          expect(projectIsSubjectOfEveryQuestion).to.be.true
        })
      })

      it('succeeds if called multiple times', function () {
        const result = ensureProjectReviewSurveysExist(this.cycle).then(() =>
          ensureProjectReviewSurveysExist(this.cycle))
        return expect(result).to.be.resolved
      })

      it('creates any missing surveys when run multiple times', async function () {
        await ensureProjectReviewSurveysExist(this.cycle)
        const firstProject = await findProjects({chapterId: this.cycle.chapterId, cycleId: this.cycle.id}).nth(0)
        const {projectReviewSurveyId} = firstProject
        delete firstProject.projectReviewSurveyId
        await projectsTable.get(firstProject.id).replace(firstProject)
        await getSurveyById(projectReviewSurveyId).delete()
        await ensureProjectReviewSurveysExist(this.cycle)
        const replacedProject = await getProjectById(firstProject.id)
        expect(replacedProject.projectReviewSurveyId).to.exist
      })

      describe('when there are other projects not in this cycle', function () {
        beforeEach(async function () {
          this.projectFromAnotherCycle = await factory.create('project', {chapterId: this.cycle.chapterId})
        })

        it('ignores them', async function () {
          const projectBefore = this.projectFromAnotherCycle
          await ensureProjectReviewSurveysExist(this.cycle)
          const projectAfter = await getProjectById(this.projectFromAnotherCycle.id)

          expect(projectAfter).to.deep.eq(projectBefore)
        })
      })
    })

    describe('when there is no projectReview surveyBlueprint', function () {
      it('rejects the promise', function () {
        return expect(ensureProjectReviewSurveysExist(this.cycle)).to.be.rejected
      })
    })
  })

  describe('ensureRetrospectiveSurveysExist', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle')
      this.createPlayersAndProjects = async numPlayersPerProject => {
        const numProjects = Math.min(numPlayersPerProject, 2)
        const numPlayersTotal = numProjects * numPlayersPerProject
        this.players = await factory.createMany('player', numPlayersTotal, {chapterId: this.cycle.chapterId})
        this.projects = await Promise.all(Array.from(Array(numProjects).keys()).map(i => {
          return factory.create('project', {
            chapterId: this.cycle.chapterId,
            cycleId: this.cycle.id,
            playerIds: this.players
              .slice(i * numPlayersPerProject, i * numPlayersPerProject + numPlayersPerProject)
              .map(p => p.id),
          })
        }))
      }
    })

    describe('when there is a restrospective surveyBlueprint with questions', function () {
      beforeEach(async function () {
        const teamQuestions = [await factory.create('question', {responseType: 'relativeContribution', subjectType: 'team'})]
        const playerQuestions = await factory.createMany('question', {responseType: 'likert7Agreement', subjectType: 'player'}, 2)
        const projectQuestions = await factory.createMany('question', {responseType: 'integer', subjectType: 'project'}, 2)
        this.questions = teamQuestions.concat(playerQuestions).concat(projectQuestions)
        this.surveyBlueprint = await factory.create('surveyBlueprint', {
          descriptor: RETROSPECTIVE_DESCRIPTOR,
          defaultQuestionRefs: this.questions.map(q => ({questionId: q.id}))
        })
      })

      it('creates a survey for each project team with all of the default retro questions', async function () {
        const numPlayersPerProject = 4
        await this.createPlayersAndProjects(numPlayersPerProject)

        await ensureRetrospectiveSurveysExist(this.cycle)

        await _itBuildsTheSurveyProperly(this.projects, this.questions)
      })

      it('ignores questions with a `responseType` of `relativeContribution` for single-player teams', async function () {
        const numPlayersPerProject = 1
        await this.createPlayersAndProjects(numPlayersPerProject)

        await ensureRetrospectiveSurveysExist(this.cycle)

        await _itBuildsTheSurveyProperly(this.projects, this.questions, {shouldIncludeRelativeContribution: false})
      })

      describe('when there are other projects not in this cycle', function () {
        beforeEach(async function () {
          this.projectFromAnotherCycle = await factory.create('project', {chapterId: this.cycle.chapterId})
        })

        it('ignores them', async function () {
          const projectBefore = this.projectFromAnotherCycle
          await ensureRetrospectiveSurveysExist(this.cycle)
          const projectAfter = await getProjectById(this.projectFromAnotherCycle.id)

          expect(projectAfter).to.deep.eq(projectBefore)
        })
      })

      it('creates any missing surveys when run multiple times', async function () {
        const numPlayersPerProject = 4
        await this.createPlayersAndProjects(numPlayersPerProject)
        await ensureRetrospectiveSurveysExist(this.cycle)
        const firstProject = await findProjects({chapterId: this.cycle.chapterId, cycleId: this.cycle.id}).nth(0)
        const {retrospectiveSurveyId} = firstProject
        delete firstProject.retrospectiveSurveyId
        await projectsTable.get(firstProject.id).replace(firstProject)
        await getSurveyById(retrospectiveSurveyId).delete()
        await ensureRetrospectiveSurveysExist(this.cycle)
        const replacedProject = await getProjectById(firstProject.id)
        expect(replacedProject.retrospectiveSurveyId).to.exist
      })
    })

    describe('when there is no retrospective surveyBlueprint', function () {
      it('rejects the promise', async function () {
        const numPlayersPerProject = 4
        await this.createPlayersAndProjects(numPlayersPerProject)
        return expect(ensureRetrospectiveSurveysExist(this.cycle)).to.be.rejected
      })
    })
  })
})

async function _itBuildsTheSurveyProperly(projects, questions, opts = null) {
  const options = opts || {shouldIncludeRelativeContribution: true}

  const tqFilter = options.shouldIncludeRelativeContribution ?
    question => question.subjectType === 'team' :
    question => question.subjectType === 'team' && question.responseType !== 'relativeContribution'
  const teamQuestions = questions.filter(tqFilter)
  const playerQuestions = questions.filter(_ => _.subjectType === 'player')
  const projectQuestions = questions.filter(_ => _.subjectType === 'project')
  const rcQuestions = questions.filter(_ => _.responseType === 'relativeContribution')

  const surveys = await r.table('surveys').run()
  expect(surveys).to.have.length(projects.length)

  const updatedProjects = await projectsTable.getAll(...projects.map(p => p.id))
  updatedProjects.forEach(project => {
    const {playerIds, retrospectiveSurveyId, id: projectId} = project

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
      expect(refs[0].subjectIds.sort()).to.deep.eq(playerIds.sort())
    })

    const compareFirstElement = ([a], [b]) => a < b ? -1 : 1
    playerQuestions.forEach(question => {
      const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
      expect(refs).to.have.length(playerIds.length)
      expect(refs.map(ref => ref.subjectIds).sort(compareFirstElement))
       .to.deep.eq(playerIds.sort().map(id => [id]))
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
        expect(refs[0].subjectIds.sort()).to.deep.eq(playerIds.sort())
      }
    })
  })
}
