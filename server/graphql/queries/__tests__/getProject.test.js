/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'

import fields from '../index'

const QUERY = 'query($identifier: String!) { getProject(identifier: $identifier) { id chapter { id } cycle { id } } }'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getProject', function () {
    beforeEach('Create current user', async function () {
      this.currentUser = await factory.build('user')
    })

    it('returns correct project for identifier', async function () {
      const projects = await factory.createMany('project', 2)
      const project = projects[0]
      const result = await runGraphQLQuery(
        QUERY,
        fields,
        {identifier: project.id},
        {currentUser: this.currentUser},
      )
      const returnedProject = result.data.getProject
      expect(returnedProject.id).to.equal(project.id)
      expect(returnedProject.chapter.id).to.equal(project.chapterId)
      expect(returnedProject.cycle.id).to.equal(project.cycleId)
    })

    it('throws an error if project is not found', function () {
      const result = runGraphQLQuery(
        QUERY,
        fields,
        {identifier: ''},
        {currentUser: this.currentUser},
      )
      return expect(result).to.eventually.be.rejectedWith(/Project not found/i)
    })

    it('throws an error if user is not signed-in', function () {
      const result = runGraphQLQuery(QUERY, fields, {identifier: ''}, {currentUser: null})
      return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
    })
  })
})
