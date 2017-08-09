/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery, useFixture} from 'src/test/helpers'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getMemberSummary(identifier: $identifier) {
      member {
        id handle
        chapter { id }
      }
      memberProjectSummaries {
        project { id name }
        memberProjectEvaluations {
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

  it('returns correct summary for member identifier', async function () {
    useFixture.nockIDMGetUser(this.user)
    const member = await factory.create('member', {id: this.user.id})
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: member.id},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getMemberSummary
    expect(returned.member.id).to.equal(this.user.id)
    expect(returned.member.handle).to.equal(this.user.handle)
    expect(returned.member.chapter.id).to.equal(member.chapterId)
    expect(returned.memberProjectSummaries).to.be.an('array')
  })

  it('throws an error if member is not found', function () {
    useFixture.nockIDMGetUser(this.user)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/Member not found/i)
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
