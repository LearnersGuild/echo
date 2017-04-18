/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
import {PROJECT_STATES} from 'src/common/models/project'
import {findProjectsToReview} from '../findProjectsToReview'

const {CLOSED, REVIEW} = PROJECT_STATES

describe(testContext(__dirname), function () {
  describe('findProjectsToReview()', function () {
    before(truncateDBTables)
    before(async function () {
      this.chapter = await factory.create('chapter')
      this.coach = await factory.create('player', {chapterId: this.chapter.id})

      return useFixture.createManyProjectsThatNeedReviews({
        coachId: this.coach.id,
        chapterId: this.chapter.id
      })
    })

    it('should sort projects by coachId first then external review count(least to most)', async function () {
      const projectsToReviewForCoach = await findProjectsToReview({coachId: this.coach.id})
      const eachProjectsReponseCount = [0, 1, 0, 1, 2]

      expect(projectsToReviewForCoach[0].coachId).to.eql(this.coach.id)
      expect(projectsToReviewForCoach[1].coachId).to.eql(this.coach.id)

      projectsToReviewForCoach.forEach((project, i) => {
        // check that the rest of the projects don't have the current user as a coach
        if (i > 1) {
          expect(projectsToReviewForCoach[i].coachId).to.not.eql(this.coach.id)
        }

        expect(project.projectReviewSurvey.responses.length).to.eql(eachProjectsReponseCount[i])
        expect(project.playerIds).to.not.include(this.coach.id)
      })
    })

    it('should not return a project that a coach was on', async function () {
      await factory.create('project', {state: REVIEW, playerIds: [this.coach.id], chapterId: this.chapter.id})
      const projectsToReviewForCoach = await findProjectsToReview({coachId: this.coach.id})

      projectsToReviewForCoach.forEach(project =>
        expect(project.playerIds).to.not.deep.include(this.coach.id)
      )
    })

    it('should not return closed projects', async function () {
      const closedProject = await factory.create('project', {state: CLOSED, chapterId: this.chapter.id})
      const projectsToReviewForCoach = await findProjectsToReview({coachId: this.coach.id})

      projectsToReviewForCoach.forEach(project =>
        expect(project.id).to.not.eql(closedProject.id)
      )
    })

    it('should not return projects from other chapters', async function () {
      const projectsToReviewForCoach = await findProjectsToReview({coachId: this.coach.id})
      const chapter = await factory.create('chapter')
      const projectFromOtherChapter = await factory.create('project', {
        state: CLOSED,
        chapterId: chapter.id
      })

      projectsToReviewForCoach.forEach(project =>
        expect(project.chapterId).to.not.eql(projectFromOtherChapter.chapterId)
      )
    })
  })
})
