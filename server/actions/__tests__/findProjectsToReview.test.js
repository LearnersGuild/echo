/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'
import {updateProject} from 'src/server/db/project'

import {findProjectsToReview} from '../findProjectsToReview'

const {
  CLOSED,
  REVIEW,
} = PROJECT_STATES

describe(testContext(__dirname), function () {
  before(truncateDBTables)

  before(async function () {
    // No Quality Question because it is being removed
    const statCompleteness = await factory.create('stat', {descriptor: STAT_DESCRIPTORS.PROJECT_COMPLETENESS})
    const question = {responseType: 'percentage', subjectType: 'project'}
    const questionCompleteness = await factory.create('question', {...question, body: 'completeness', statId: statCompleteness.id})

    this.createReview = (player, project, survey, responseAttrs = {}) => {
      const response = {...responseAttrs, respondentId: player.id, surveyId: survey.id, subjectId: project.id, value: 88}
      return factory.create('response', {
        ...response,
        questionId: questionCompleteness.id
      })
    }
  })

  useFixture.createProjectReviewSurvey()

  it.only('should list out the projects with the current users coach id.', async function () {
    await this.createProjectReviewSurvey()


    const [coach] = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
    // const [openProject1, openProject2] = await factory.createMany('project', {state: REVIEW, chapterId: coach.chapterId, coachId: coach.id}, 2)
    await updateProject({
      id: this.project.id,
      coachId: coach.id,
    })
    // const projectNames = projects => projects.map(_ => _.name).sort()
    await this.createReview(player1, this.project, this.survey)
    await this.createReview(coach, this.project, this.survey)

    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})

    // Should the function return a different result if user is a coach???
    // expect(projectNames(projectsToReviewForCoach)).to.be.an('array')
    // expect(openProject2).to.be.an('object')

    projectsToReviewForCoach.forEach(project =>
      expect(project.coachId).to.eql(coach.id)
    )
  })

  beforeEach(truncateDBTables)

  it('should return no projects if the are none to review.', async function () {
    const [coach] = await factory.createMany('player', 1)
    await factory.createMany('project', {state: CLOSED, coachId: coach.id}, 2)

    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
    const uncompleteReviews = projectsToReviewForCoach
      .filter(project => project.state === REVIEW)

    expect(uncompleteReviews.length).to.eql(0)
  })

  it('should return 1 projects out of three', async function () {
    const [coach] = await factory.createMany('player', 1)
    await factory.createMany('project', {state: CLOSED, coachId: coach.id}, 2)

    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
    const uncompleteReviews = projectsToReviewForCoach
      .filter(project => project.state === REVIEW)

    expect(uncompleteReviews.length).to.eql(1)
  })

  it('should return the projects that the user coached first.', async function () {
    const [coach] = await factory.createMany('player', 1)
    await factory.createMany('project', {state: REVIEW}, 5)
    await factory.createMany('project', {state: REVIEW, coachId: coach.id}, 2)

    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})

    expect(projectsToReviewForCoach[0].coachId).to.eql(coach.id)
    expect(projectsToReviewForCoach[1].coachId).to.eql(coach.id)
  })
})
