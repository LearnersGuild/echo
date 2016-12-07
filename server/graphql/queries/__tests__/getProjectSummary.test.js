/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getProjectSummary(identifier: $identifier) {
      project { id chapter { id } }
      projectReviews {
        completeness
        quality
        submittedBy { id handle }
      }
      projectUserSummaries {
        user { id handle }
        userProjectReviews {
          contribution
          technical
          culture
          submittedBy { id handle }
        }
        userProjectStats { rating xp }
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
