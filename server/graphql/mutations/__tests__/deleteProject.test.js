/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'

import fields from '../index'

const query = `
  query($identifier: String!) {
    deleteProject(identifier: $identifier) {
      success
    }
  }
`

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user', {roles: ['moderator']})
  })

  it('returns success for valid identifier', async function () {
    const project = await factory.create('project')
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: project.id},
      {currentUser: this.currentUser},
    )
    expect(result.data.deleteProject.success).to.equal(true)
  })

  it('throws an error if user is not authorized', function () {
    const result = runGraphQLQuery(query, fields, {identifier: ''}, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
