/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import {Project} from 'src/server/services/dataService'

import fields from '../index'

const query = `
  query($identifiers: [String]) {
    findProjects(identifiers: $identifiers) {
      id
      chapter { id }
      cycle { id }
    }
  }
`

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user')
    this.projects = await factory.createMany('project', 3)
  })

  it('returns correct projects for identifiers', async function () {
    const project = this.projects[0]
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifiers: [project.id]},
      {currentUser: this.currentUser},
    )
    const returnedProjects = result.data.findProjects
    const returnedProject = returnedProjects[0]
    expect(returnedProjects.length).to.equal(1)
    expect(returnedProject.id).to.equal(project.id)
    expect(returnedProject.chapter.id).to.equal(project.chapterId)
    expect(returnedProject.cycle.id).to.equal(project.cycleId)
  })

  it('returns all projects if no identifiers specified', async function () {
    const allProjects = await Project.run()
    const {data: {findProjects: result}} = await runGraphQLQuery(
      query,
      fields,
      null,
      {currentUser: this.currentUser},
    )
    expect(result.length).to.equal(allProjects.length)
    expectArraysToContainTheSameElements(allProjects.map(p => p.id), result.map(p => p.id))
  })

  it('returns no projects if no matching identifiers specified', async function () {
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifiers: ['']},
      {currentUser: this.currentUser},
    )
    expect(result.data.findProjects.length).to.equal(0)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, null, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
