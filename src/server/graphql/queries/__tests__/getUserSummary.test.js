/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery, useFixture} from 'src/test/helpers'
import FEEDBACK_TYPE_DESCRIPTORS from 'src/common/models/feedbackType'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getUserSummary(identifier: $identifier) {
      user {
        id handle
        chapter { id }
      }
      userProjectSummaries {
        project { id name }
        userProjectEvaluations {
          submittedBy { id name handle }
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
    this.user = await factory.build('user')
  })

  it('returns correct summary for user identifier', async function () {
    useFixture.nockIDMGetUser(this.user)
    const member = await factory.create('member', {id: this.user.id})
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: member.id},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getUserSummary
    expect(returned.user.id).to.equal(this.user.id)
    expect(returned.user.handle).to.equal(this.user.handle)
    expect(returned.user.chapter.id).to.equal(member.chapterId)
    expect(returned.userProjectSummaries).to.be.an('array')
  })

  it('throws an error if user is not found', function () {
    useFixture.nockIDMGetUser(this.user)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/User not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: null}
    )
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
