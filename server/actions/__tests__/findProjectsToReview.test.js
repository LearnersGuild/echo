/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'

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

    this.createReview = (player, project, responseAttrs = {}) => {
      const response = {...responseAttrs, respondentId: player.id, subjectId: project.id, value: 88}
      return factory.create('response', {
        ...response,
        questionId: questionCompleteness.id
      })
    }
  })

  it('should list out the projects with the current users coach id.', async function () {
    const [player1, player2, coach] = await factory.createMany('player', 3)
    const [openProject1, openProject2] = await factory.createMany('project', {state: REVIEW, coachId: coach.id}, 2)
    const closedProject = await factory.create('project', {state: CLOSED})
    const projectNames = projects => projects.map(_ => _.name).sort()

    await this.createReview(player1, openProject1)
    await this.createReview(player1, openProject2)
    await this.createReview(player2, openProject2)
    await this.createReview(coach, openProject1)

    // Should the function return a different result if user is a coach???
    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})

    expect(projectNames(projectsToReviewForCoach)).to.be.an('array')
    expect(openProject2).to.be.an('object')

    projectsToReviewForCoach.forEach(project =>
      expect(project.coachId).to.eql(coach.id)
    )
  })

  beforeEach(truncateDBTables)

  it('should return no projects if the are none to review.', async function() {
    const [player1, player2, coach] = await factory.createMany('player', 3)
    const [openProject1, openProject2] = await factory.createMany('project', {state: CLOSED, coachId: coach.id}, 2)
    const projectNames = projects => projects.map(_ => _.name).sort()

    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
    const uncompleteReviews = projectsToReviewForCoach
      .filter(project => project.state === REVIEW)

    expect(uncompleteReviews.length).to.eql(0)
  })

  it('should return 1 projects out of three', async function() {
    const [coach] = await factory.createMany('player', 1)
    const [openProject1, openProject2] = await factory.createMany('project', {state: CLOSED, coachId: coach.id}, 2)
    const closedProject2 = await factory.create('project', {state: REVIEW})

    const projectNames = projects => projects.map(_ => _.name).sort()

    const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
    const uncompleteReviews = projectsToReviewForCoach
      .filter(project => project.state === REVIEW)

    expect(uncompleteReviews.length).to.eql(1)
  })
})
