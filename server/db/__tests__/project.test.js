/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'
import {Cycle} from 'src/server/services/dataService'
import {PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'
import {recordSurveyCompletedBy} from 'src/server/db/survey'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import factory from 'src/test/factories'

import {
  findProjectByNameForPlayer,
  findProjectBySurveyId,
  findProjectsAndReviewResponsesForPlayer,
  getProjectByName,
  findProjectsForUser,
  updateProject,
  findProjectByPlayerIdAndCycleId,
  findActiveProjectsForChapter,
} from '../project'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.setCurrentCycleAndUserForProject()

  describe('findProjectByNameForPlayer()', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
    })

    it('finds the project with the given name where the user is or was a team member', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const project = await findProjectByNameForPlayer(this.project.name, this.currentUser.id)
      return expect(project.playerIds).to.contain(this.currentUser.id)
    })

    it('throws an error if the player has never worked on that project', async function () {
      const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})

      const projectPromise = findProjectByNameForPlayer(this.project.name, inactivePlayer.id)
      return expect(projectPromise).to.be.rejectedWith(/No such project.*that name.*that player/)
    })

    it('throws an error if there is no project with the given name', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const projectPromise = findProjectByNameForPlayer('non-existent-project-name', this.currentUser.id)
      return expect(projectPromise).to.be.rejectedWith(/No such project.*that name.*that player/)
    })
  })

  describe('findProjectByPlayerIdAndCycleId', function () {
    const playerId = 'p1'
    const cycleId = 'c1'
    const createProjectWithWrongPlayers = () => factory.create('project', {playerIds: ['p4', 'p5', 'p6'], cycleId: 'c1'})
    const createProjectInWrongCycle = () => factory.create('project', {playerIds: ['p1', 'p2', 'p3'], cycleId: 'c2'})
    const createMatchingProject = () => factory.create('project', {playerIds: ['p1', 'p2', 'p3'], cycleId: 'c1'})

    it('finds the right projects', async function () {
      const [match] = await Promise.all([
        createMatchingProject(),
        createProjectWithWrongPlayers(),
        createProjectInWrongCycle(),
      ])

      const result = await findProjectByPlayerIdAndCycleId(playerId, cycleId)
      expect(result).to.deep.eq(match)
    })

    it('throws a useful error when the player is in multiple projects', async function () {
      await Promise.all([
        createMatchingProject(),
        createMatchingProject(),
      ])

      return expect(findProjectByPlayerIdAndCycleId(playerId, cycleId))
        .to.be.rejectedWith('player is in multiple projects')
    })

    it('throws a useful error when no projects found', async function () {
      await Promise.all([
        createProjectWithWrongPlayers(),
        createProjectInWrongCycle(),
      ])

      return expect(findProjectByPlayerIdAndCycleId(playerId, cycleId))
        .to.be.rejectedWith('player is not in any projects this cycle')
    })
  })

  describe('getProjectByName()', function () {
    it('finds the right project', async function () {
      const project = await factory.create('project', {name: 'projectName'})
      const result = await getProjectByName('projectName')
      expect(result.id).to.eq(project.id)
    })

    it('rejects the promise when no project found', async function () {
      await factory.create('project', {name: 'projectName'})
      const promise = getProjectByName('anotherName')
      await expect(promise).to.eventually.be.rejectedWith('No project found')
    })
  })

  describe('findProjectBySurveyId()', function () {
    it('finds the right project for a given retrospectiveSurveyId', async function () {
      const [otherProject, targetProject] = await factory.createMany('project', 2)
      const [otherSurvey, targetSurvey] = await factory.createMany('survey', 2)

      await updateProject({id: targetProject.id, retrospectiveSurveyId: targetSurvey.id})
      await updateProject({id: otherProject.id, retrospectiveSurveyId: otherSurvey.id})

      const returnedProject = await findProjectBySurveyId(targetSurvey.id)
      expect(returnedProject.id).to.eq(targetProject.id)
    })

    it('finds the right project for a given projectReviewSurveyId', async function () {
      const [otherProject, targetProject] = await factory.createMany('project', 2)
      const [otherSurvey, targetSurvey] = await factory.createMany('survey', 2)

      await updateProject({id: targetProject.id, projectReviewSurveyId: targetSurvey.id})
      await updateProject({id: otherProject.id, projectReviewSurveyId: otherSurvey.id})

      const returnedProject = await findProjectBySurveyId(targetSurvey.id)
      expect(returnedProject.id).to.eq(targetProject.id)
    })
  })

  describe('findProjectsForUser()', function () {
    useFixture.setCurrentCycleAndUserForProject()
    beforeEach(async function () {
      this.chapter = await factory.create('chapter')
      this.userProject = await factory.create('project', {chapterId: this.chapter.id})
      await this.setCurrentCycleAndUserForProject(this.userProject)
      this.otherProject = await factory.create('project', {chapterId: this.chapter.id})
    })

    it('returns the projects for the given player', async function () {
      const projectIds = (await findProjectsForUser(this.currentUser.id))
        .map(p => p.id)
      return expect(projectIds).to.deep.equal([this.userProject.id])
    })

    it('does not return projects with which the player is not involved', async function () {
      const projectIds = (await findProjectsForUser(this.currentUser.id))
        .map(p => p.id)
      return expect(projectIds).to.not.contain(this.otherProject.id)
    })
  })

  describe('findProjectsAndReviewResponsesForPlayer()', function () {
    describe('when there are projects to review', function () {
      useFixture.createChapterInReflectionState()
      beforeEach(async function () {
        await this.createChapterInReflectionState()

        // review the first project
        this.reviewedProject = this.projects[0]
        this.reviewedProjectSurvey = this.surveys[0]
        this.respondentId = this.reviewedProject.playerIds[0]
        await Promise.all(this.reviewedProjectSurvey.questionRefs.map((ref, i) => {
          return saveSurveyResponse({
            respondentId: this.respondentId,
            values: [{
              subjectId: this.reviewedProject.id,
              value: i + 10,
            }],
            surveyId: this.reviewedProjectSurvey.id,
            questionId: ref.questionId,
          })
        }))
        await recordSurveyCompletedBy(this.reviewedProjectSurvey.id, this.respondentId)

        this.projectsForReview = await findProjectsAndReviewResponsesForPlayer(this.chapter.id, this.cycle.id, this.respondentId)
      })

      it('finds all of the projects for the given cycle', function () {
        return expect(this.projectsForReview.length).to.equal(this.projects.length)
      })

      it('returns any review responses for the player', function () {
        this.projectsForReview.forEach(project => {
          expect(project).to.have.property('projectReviewResponses')
          expect(project.projectReviewResponses.length).to.equal(this.reviewedProjectSurvey.questionRefs.length)

          if (project.id === this.reviewedProject.id) {
            project.projectReviewResponses.forEach(response => {
              expect(response.value).to.be.ok
            })
          } else {
            project.projectReviewResponses.forEach(response => {
              expect(response.value).to.not.be.ok
            })
          }
        })
      })
    })

    describe('when there are no projects to review', function () {
      it('returns an empty array', async function () {
        const chapter = await factory.create('chapter')
        const cycle = await factory.create('cycle', {chapterId: chapter.id})
        const player = await factory.create('player', {chapterId: chapter.id})
        const returnedProjects = await findProjectsAndReviewResponsesForPlayer(chapter.id, cycle.id, player.id)

        expect(returnedProjects.length).to.equal(0)
      })
    })

    describe('when there is a project without a review survey', function () {
      it('returns an empty array', async function () {
        const chapter = await factory.create('chapter')
        const cycle = await factory.create('cycle', {chapterId: chapter.id})
        const player = await factory.create('player', {chapterId: chapter.id})
        await factory.create('project', {chapterId: chapter.id, cycleId: cycle.id, playerIds: [player.id]})
        const returnedProjects = await findProjectsAndReviewResponsesForPlayer(chapter.id, cycle.id, player.id)

        expect(returnedProjects.length).to.equal(0)
      })
    })
  })

  describe('findActiveProjectsForChapter', function () {
    beforeEach('set up chapter, cycle, project', async function () {
      this.chapter = await factory.create('chapter')
      this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
      this.projects = await factory.createMany('project', {
        chapterId: this.chapter.id,
        cycleId: this.cycle.id,
      }, 3)
    })

    it('retrieves projects in the latest cycle if in PRACTICE state', async function () {
      await Cycle.get(this.cycle.id).update({state: PRACTICE})
      const activeProjects = await findActiveProjectsForChapter(this.chapter.id)
      expectArraysToContainTheSameElements(
        activeProjects.map(p => p.id),
        this.projects.map(p => p.id),
      )
    })

    it('retrieves projects in the latest cycle if in REFLECTION state', async function () {
      await Cycle.get(this.cycle.id).update({state: REFLECTION})
      const activeProjects = await findActiveProjectsForChapter(this.chapter.id)
      expectArraysToContainTheSameElements(
        activeProjects.map(p => p.id),
        this.projects.map(p => p.id),
      )
    })

    it('does not retrieve projects in the latest cycle if in COMPLETE state', async function () {
      await Cycle.get(this.cycle.id).update({state: COMPLETE})
      const activeProjects = await findActiveProjectsForChapter(this.chapter.id)
      expect(activeProjects.length).to.eq(0)
    })

    it('returns count if specified', async function () {
      await Cycle.get(this.cycle.id).update({state: PRACTICE})
      const activeProjectCount = await findActiveProjectsForChapter(this.chapter.id, {count: true})
      expect(activeProjectCount).to.eq(this.projects.length)
    })
  })
})
