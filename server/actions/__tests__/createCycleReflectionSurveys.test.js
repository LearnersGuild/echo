/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, expectSetEquality} from '../../../test/helpers'
import {table as projectsTable, getProjectById, getTeamPlayerIds, getProjectHistoryForCycle} from '../../../server/db/project'
import {PROJECT_REVIEW_DESCRIPTOR, RETROSPECTIVE_DESCRIPTOR} from '../../../common/models/surveyBlueprint'

import {
  createProjectReviewSurveys,
  createRetrospectiveSurveys,
} from '../createCycleReflectionSurveys'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('createProjectReviewSurveys', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle')
      this.players = await factory.createMany('player', 8, {chapterId: this.cycle.chapterId})
      this.projects = await Promise.all(Array.from(Array(2).keys()).map(i => {
        return factory.create('project', {
          chapterId: this.cycle.chapterId,
          cycleHistory: [
            {
              cycleId: this.cycle.id,
              playerIds: this.players.slice(i * 4, i * 4 + 4).map(p => p.id)
            }
          ]
        })
      }))
    })

    describe('when there is a projectReview surveyBlueprint with questions', function () {
      beforeEach(async function() {
        this.questions = await factory.createMany('question', {
          subjectType: 'project',
          responseType: 'percentage'
        }, 2)
        this.surveyBlueprint = await factory.create('surveyBlueprint', {
          descriptor: PROJECT_REVIEW_DESCRIPTOR,
          defaultQuestionRefs: [
            {name: 'completeness', questionId: this.questions[0].id},
            {name: 'quality', questionId: this.questions[1].id},
          ]
        })
      })

      it('creates a survey for each project with all of the default questions', async function() {
        await createProjectReviewSurveys(this.cycle)

        const surveys = await r.table('surveys').run()
        expect(surveys).to.have.length(this.projects.length)

        const updatedProjects = await projectsTable.getAll(...this.projects.map(p => p.id))
        updatedProjects.forEach(project => {
          const surveyId = getProjectHistoryForCycle(project, this.cycle.id).projectReviewSurveyId
          const survey = surveys.find(({id}) => id === surveyId)

          expect(survey).to.exist
          expectSetEquality(
            survey.questionRefs.map(({questionId}) => questionId),
            this.questions.map(({id}) => id),
          )

          survey.questionRefs.forEach(ref => expect(ref).to.have.property('name'))

          const projectIsSubjectOfEveryQuestion =
            survey.questionRefs.every(({subjectIds}) => subjectIds[0] === project.id)
          expect(projectIsSubjectOfEveryQuestion).to.be.true
        })
      })

      it('fails if called multiple times', function () {
        return expect(
          createProjectReviewSurveys(this.cycle)
          .then(() => createProjectReviewSurveys(this.cycle))
        ).to.be.rejected
      })

      describe('when there are other projects not in this cycle', function () {
        beforeEach(async function () {
          this.projectFromAnotherCycle = await factory.create('project', {chapterId: this.cycle.chapterId})
        })

        it('ignores them', async function () {
          const projectBefore = this.projectFromAnotherCycle
          await createProjectReviewSurveys(this.cycle)
          const projectAfter = await getProjectById(this.projectFromAnotherCycle.id)

          expect(projectAfter).to.deep.eq(projectBefore)
        })
      })
    })

    describe('when there is no projectReview surveyBlueprint', function () {
      it('rejects the promise', function () {
        return expect(createProjectReviewSurveys(this.cycle)).to.be.rejected
      })
    })
  })

  describe('createRetrospectiveSurveys', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle')
      this.players = await factory.createMany('player', 8, {chapterId: this.cycle.chapterId})
      this.projects = await Promise.all(Array.from(Array(2).keys()).map(i => {
        return factory.create('project', {
          chapterId: this.cycle.chapterId,
          cycleHistory: [
            {
              cycleId: this.cycle.id,
              playerIds: this.players.slice(i * 4, i * 4 + 4).map(p => p.id)
            }
          ]
        })
      }))
    })

    describe('when there is a restrospective surveyBlueprint with questions', function () {
      beforeEach(async function() {
        this.teamQuestions = await factory.createMany('question', {subjectType: 'team'}, 2)
        this.playerQuestions = await factory.createMany('question', {subjectType: 'player'}, 2)
        this.questions = this.teamQuestions.concat(this.playerQuestions)
        this.surveyBlueprint = await factory.create('surveyBlueprint', {
          descriptor: RETROSPECTIVE_DESCRIPTOR,
          defaultQuestionRefs: this.questions.map(q => ({questionId: q.id}))
        })
      })

      it('creates a survey for each project team with all of the default retro questions', async function() {
        await createRetrospectiveSurveys(this.cycle)

        const surveys = await r.table('surveys').run()
        expect(surveys).to.have.length(this.projects.length)

        const updatedProjects = await projectsTable.getAll(...this.projects.map(p => p.id))
        updatedProjects.forEach(project => {
          const surveyId = getProjectHistoryForCycle(project, this.cycle.id).retrospectiveSurveyId
          const survey = surveys.find(({id}) => id === surveyId)

          expect(survey).to.exist

          const questionIds = this.questions.map(({id}) => id)
          const surveyRefIds = survey.questionRefs.map(({questionId}) => questionId)

          const refOffsets = surveyRefIds.map(refId => questionIds.indexOf(refId))
          expect(refOffsets).to.deep.equal(refOffsets.sort())

          expectSetEquality(questionIds, surveyRefIds)

          const playerIds = getTeamPlayerIds(project, this.cycle.id)
          this.teamQuestions.forEach(question => {
            const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
            expect(refs).to.have.length(1)
            expect(refs[0].subjectIds.sort()).to.deep.eq(playerIds.sort())
          })

          const compareFirstElement = ([a], [b]) => a < b ? -1 : 1
          this.playerQuestions.forEach(question => {
            const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
            expect(refs).to.have.length(playerIds.length)
            expect(refs.map(ref => ref.subjectIds).sort(compareFirstElement))
             .to.deep.eq(playerIds.sort().map(id => [id]))
          })
        })
      })

      describe('when there are other projects not in this cycle', function () {
        beforeEach(async function () {
          this.projectFromAnotherCycle = await factory.create('project', {chapterId: this.cycle.chapterId})
        })

        it('ignores them', async function () {
          const projectBefore = this.projectFromAnotherCycle
          await createRetrospectiveSurveys(this.cycle)
          const projectAfter = await getProjectById(this.projectFromAnotherCycle.id)

          expect(projectAfter).to.deep.eq(projectBefore)
        })
      })

      it('fails if called multiple times', function () {
        return expect(
          createRetrospectiveSurveys(this.cycle)
          .then(() => createRetrospectiveSurveys(this.cycle))
        ).to.be.rejected
      })
    })

    describe('when there is no retrospective surveyBlueprint', function () {
      it('rejects the promise', function () {
        return expect(createRetrospectiveSurveys(this.cycle)).to.be.rejected
      })
    })
  })
})
