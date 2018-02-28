/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import nock from 'nock'

import factory from 'src/test/factories'
import {resetDB, mockIdmUsersById} from 'src/test/helpers'

import findProjectsWithWorkPlansForMember from '../findProjectsWithWorkPlansForMember'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('CREATE PROJECT AND USER', async function () {
    nock.cleanAll()
    this.userWithoutProject = await factory.build('user')
    this.project = await factory.create('project with work plan')
    this.currentUser = await factory.build('user', {id: this.project.memberIds[0]})
    await mockIdmUsersById(this.project.memberIds)
  })

  afterEach(function () {
    nock.cleanAll()
  })

  it('throws an error if member identifier is invalid', function () {
    const result = findProjectsWithWorkPlansForMember('fake.id')
    return expect(result).to.be.rejectedWith(/Member not found/)
  })

  it('returns an empty array if member has no projects (member obj as identifier)', async function () {
    const projectsReturned = await findProjectsWithWorkPlansForMember(this.userWithoutProject)
    return expect(projectsReturned.length).to.eq(0)
  })

  it('returns a project if member belongs to a project that contains a work plan (member obj as identifier)', async function () {
    const projectReturned = await findProjectsWithWorkPlansForMember(this.currentUser)
    expect(projectReturned.length).to.eq(1)
    expect(projectReturned[0].name).to.eq(this.project.name)
    expect(projectReturned[0].workPlanSurveyId).to.eq(this.project.workPlanSurveyId)
  })
})
