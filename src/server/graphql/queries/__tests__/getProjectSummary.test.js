/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery, useFixture} from 'src/test/helpers'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getProjectSummary(identifier: $identifier) {
      project {
        id
        chapter { id }
      }
      projectMemberSummaries {
        member { id handle }
        memberProjectEvaluations {
          submittedBy { id handle }
          createdAt
          ${FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK}
        }
      }
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user', {roles: ['admin']})
    this.users = await factory.buildMany('user', 3)
    this.project = await factory.create('project', {memberIds: this.users.map(u => u.id)})
    await Promise.each(this.users, user => (
      factory.create('member', {id: user.id})
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
    expect(returned.projectMemberSummaries).to.be.an('array')
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
