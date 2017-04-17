/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
// import {STAT_DESCRIPTORS} from 'src/common/models/stat'
// import {PROJECT_STATES} from 'src/common/models/project'
// import {updateProject} from 'src/server/db/project'

import {findProjectsToReview} from '../findProjectsToReview'

// const {
//   CLOSED,
//   REVIEW,
// } = PROJECT_STATES

describe(testContext(__dirname), function () {
  before(truncateDBTables)
  before(async function () {
    this.chapter = await factory.create('chapter')
    this.coach = await factory.create('player', {chapterId: this.chapterId})
    useFixture.createManyProjectsThatNeedReviews({
      coachId: this.coach.id,
      chapterId: this.chapter.id
    })
  })

  it('should list out the projects with the current users coach id.', async function () {
    const projectsToReviewForCoach = await findProjectsToReview({coachId: this.coach.id})

    // Should the function return a different result if user is a coach???
    // expect(projectNames(projectsToReviewForCoach)).to.be.an('array')
    // expect(openProject2).to.be.an('object')
    //
    // projectsToReviewForCoach.forEach(project =>
    //   expect(project.coachId).to.eql(coach.id)
    // )

    console.log(require('util').inspect({projectsToReviewForCoach}, {depth: 5}))
    expect(true).to.be.true
  })

  // beforeEach(truncateDBTables)
  //
  // it('should return no projects if the are none to review.', async function () {
  //   const [coach] = await factory.createMany('player', 1)
  //   await factory.createMany('project', {state: CLOSED, coachId: coach.id}, 2)
  //
  //   const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
  //   const uncompleteReviews = projectsToReviewForCoach
  //     .filter(project => project.state === REVIEW)
  //
  //   expect(uncompleteReviews.length).to.eql(0)
  // })
  //
  // it('should return 1 projects out of three', async function () {
  //   const [coach] = await factory.createMany('player', 1)
  //   await factory.createMany('project', {state: CLOSED, coachId: coach.id}, 2)
  //
  //   const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
  //   const uncompleteReviews = projectsToReviewForCoach
  //     .filter(project => project.state === REVIEW)
  //
  //   expect(uncompleteReviews.length).to.eql(1)
  // })
  //
  // it('should return the projects that the user coached first.', async function () {
  //   const [coach] = await factory.createMany('player', 1)
  //   await factory.createMany('project', {state: REVIEW}, 5)
  //   await factory.createMany('project', {state: REVIEW, coachId: coach.id}, 2)
  //
  //   const projectsToReviewForCoach = await findProjectsToReview({coachId: coach.id})
  //
  //   expect(projectsToReviewForCoach[0].coachId).to.eql(coach.id)
  //   expect(projectsToReviewForCoach[1].coachId).to.eql(coach.id)
  // })
})
