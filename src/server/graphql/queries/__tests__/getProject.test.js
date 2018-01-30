/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery} from 'src/test/helpers'

import getProject from '../getProject'

const fields = {getProject}
const query = `
  query($identifier: String!) {
    getProject(identifier: $identifier) {
      id
      chapter { id }
      cycle { id }
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user')
  })

  it('returns correct project for identifier', async function () {
    const projects = await factory.createMany('project', 2)
    const project = projects[0]
    const context = {currentUser: this.currentUser}
    const variables = {identifier: project.id}
    const result = await runGraphQLQuery(fields, query, context, variables)
    const returnedProject = result.data.getProject
    expect(returnedProject.id).to.equal(project.id)
    expect(returnedProject.chapter.id).to.equal(project.chapterId)
    expect(returnedProject.cycle.id).to.equal(project.cycleId)
  })

  it('throws an error if project is not found', function () {
    const context = {currentUser: this.currentUser}
    const variables = {identifier: ''}
    const result = runGraphQLQuery(fields, query, context, variables)
    return expect(result).to.eventually.be.rejectedWith(/Project not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const context = {currentUser: null}
    const variables = {identifier: ''}
    const result = runGraphQLQuery(fields, query, context, variables)
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
