/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'
import {Project} from 'src/server/services/dataService'

import fields from '../index'

const FAKE_ID = 'fake.id'
const QUERY = 'query($identifiers: [String]) { findProjects(identifiers: $identifiers) { id chapter { id } cycle { id } } }'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('findProjects', function () {
    beforeEach('Create current user', async function () {
      this.currentUser = await factory.build('user')
    })

    it('returns correct projects for identifiers', async function () {
      const projects = await factory.createMany('project', 2)
      const project = projects[0]
      const result = await runGraphQLQuery(
        QUERY,
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
      await factory.createMany('project', 3)
      const allProjects = await Project.run()
      const result = await runGraphQLQuery(
        QUERY,
        fields,
        null,
        {currentUser: this.currentUser},
      )
      expect(result.data.findProjects.length).to.equal(allProjects.length)
      allProjects.forEach(project => {
        expect(result.data.findProjects.find(p => p.id === project.id)).to.exist
      })
    })

    it('returns no projects if no matching identifiers specified', async function () {
      const result = await runGraphQLQuery(
        QUERY,
        fields,
        {identifiers: [FAKE_ID]},
        {currentUser: this.currentUser},
      )
      expect(result.data.findProjects.length).to.equal(0)
    })

    it('throws an error if user is not signed-in', function () {
      const result = runGraphQLQuery(QUERY, fields, null, {currentUser: null})
      return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
    })
  })
})
