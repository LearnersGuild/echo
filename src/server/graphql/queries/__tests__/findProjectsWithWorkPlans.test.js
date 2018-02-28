/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'

import {resetDB, runGraphQLQuery, mockIdmUsersById} from 'src/test/helpers'
import factory from 'src/test/factories'

import findProjectsWithWorkPlans from '../findProjectsWithWorkPlans'

const fields = {findProjectsWithWorkPlans}
const query = `
  query {
    findProjectsWithWorkPlans {
      id,
      name
    }
  }
  `

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Setup Project With Work Plan Survey', async function () {
    nock.cleanAll()
    this.project = await factory.create('project with work plan')
    this.currentUser = await factory.build('user', {id: this.project.memberIds[0]})
    await mockIdmUsersById(this.project.memberIds)
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('throws an error if user is not signed-in', function () {
    const context = {currentUser: null}
    const variables = {id: 'fake.id'}
    const result = runGraphQLQuery(fields, query, context, variables)
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })

  it('returns a list of projects that have work plans for the signed-in user', async function () {
    const context = {currentUser: this.currentUser}
    const result = await runGraphQLQuery(fields, query, context)
    const data = result.data.findProjectsWithWorkPlans
    expect(data.length).to.eq(1)
    expect(data[0].id).to.eq(this.project.id)
    expect(data[0].name).to.eq(this.project.name)
  })
})
