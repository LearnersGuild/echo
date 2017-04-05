/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'

import findClosedProjectsReviewedByUser from '../findClosedProjectsReviewedByUser'

const {
  CLOSED,
  REVIEW,
} = PROJECT_STATES

describe(testContext(__filename), function () {
  before(truncateDBTables)

  before(async function () {
    const statCompleteness = await factory.create('stat', {descriptor: STAT_DESCRIPTORS.PROJECT_COMPLETENESS})
    const question = {responseType: 'percentage', subjectType: 'project'}
    const questionCompleteness = await factory.create('question', {...question, body: 'completeness', statId: statCompleteness.id})

    this.createReview = (player, project, responseAttrs = {}) => {
      const response = {...responseAttrs, respondentId: player.id, subjectId: project.id, value: 80}
      return factory.createMany('response', [
        {...response, questionId: questionCompleteness.id},
      ])
    }
  })

  it('returns correct projects', async function () {
    const [player1, player2] = await factory.createMany('player', 2)
    const [project1, project2, project3] = await factory.createMany('project', {state: CLOSED}, 3)
    const projectInReview = await factory.create('project', {state: REVIEW})
    const names = projects => projects.map(_ => _.name).sort()

    await this.createReview(player1, project1)
    await this.createReview(player1, project2)
    await this.createReview(player1, project3)

    await this.createReview(player2, project1)
    await this.createReview(player2, project2)
    await this.createReview(player2, projectInReview)

    const player1Projects = await findClosedProjectsReviewedByUser(player1.id)
    expect(names(player1Projects)).to.deep.eq(names([project1, project2, project3]))

    const player2Projects = await findClosedProjectsReviewedByUser(player2.id)
    expect(names(player2Projects)).to.deep.eq(names([project1, project2]))
  })

  it('can be filtered by a start/end dates', async function () {
    const player = await factory.create('player')
    const [project1, project2, project3] = await factory.createMany('project', {state: CLOSED}, 3)
    const names = projects => projects.map(_ => _.name).sort()

    const [day1, day2, day3] = [
      new Date('2000-01-01'),
      new Date('2000-02-02'),
      new Date('2000-03-03'),
    ]

    await this.createReview(player, project1, {createdAt: day1})
    await this.createReview(player, project2, {createdAt: day2})
    await this.createReview(player, project3, {createdAt: day3})

    const projectSinceDay1 = await findClosedProjectsReviewedByUser(player.id, {
      since: day1
    })
    expect(names(projectSinceDay1)).to.deep.eq(names([project2, project3]))

    const projectsBetweenDays1And2 = await findClosedProjectsReviewedByUser(player.id, {
      since: day1,
      before: day3,
    })
    expect(names(projectsBetweenDays1And2)).to.deep.eq(names([project2]))
  })
})
