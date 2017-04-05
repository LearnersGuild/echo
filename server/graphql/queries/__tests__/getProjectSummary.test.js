/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getProjectSummary(identifier: $identifier) {
      project {
        id
        chapter { id }
        stats {
          ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
          ${STAT_DESCRIPTORS.PROJECT_HOURS}
        }
      }
      projectEvaluations {
        submittedBy { id handle }
        createdAt
        ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
      }
      projectUserSummaries {
        user { id handle }
        userProjectEvaluations {
          submittedBy { id handle }
          createdAt
          ${STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION}
          ${STAT_DESCRIPTORS.TECHNICAL_HEALTH}
          ${STAT_DESCRIPTORS.CULTURE_CONTRIBUTION}
        }
        userProjectStats {
          ${STAT_DESCRIPTORS.EXPERIENCE_POINTS}
          ${STAT_DESCRIPTORS.ELO}
        }
      }
    }
  }
`

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user', {roles: ['moderator']})
    this.users = await factory.buildMany('user', 3)
    this.project = await factory.create('project', {playerIds: this.users.map(u => u.id)})
    await Promise.each(this.users, user => (
      factory.create('player', {id: user.id})
    ))
  })

  it('returns correct summary for project identifier', async function () {
    useFixture.nockIDMFindUsers(this.users)
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: this.project.id},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getProjectSummary
    expect(returned.project.id).to.equal(this.project.id)
    expect(returned.project.chapter.id).to.equal(this.project.chapterId)
    expect(returned.project.stats).to.have.property(STAT_DESCRIPTORS.PROJECT_COMPLETENESS)
    expect(returned.project.stats).to.have.property(STAT_DESCRIPTORS.PROJECT_HOURS)
    expect(returned.projectUserSummaries).to.be.an('array')
  })

  it('throws an error if project is not found', function () {
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/Project not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, {identifier: ''}, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
