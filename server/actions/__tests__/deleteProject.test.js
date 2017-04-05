/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'
import {Project} from 'src/server/services/dataService'
import {PROJECT_STATES} from 'src/common/models/project'

import deleteProject from '../deleteProject'

describe(testContext(__filename), function () {
  withDBCleanup()

  it('resolves successfully the 1st time and throws an error if attempted a 2nd time', async function () {
    const project = await factory.create('project', {state: PROJECT_STATES.IN_PROGRESS})
    const result = await deleteProject(project.id)
    expect(result).to.eq(null)

    const deletedProject = Project.get(project.id)
    return expect(deletedProject).to.eventually.be.rejectedWith(/returned null/i)
  })

  it('throws an error if project not found', async function () {
    const result = deleteProject('fake.id')
    return expect(result).to.eventually.be.rejectedWith(/not found/i)
  })

  it('throws an error if project is not in IN_PROGRESS state', async function () {
    const project = await factory.create('project', {state: PROJECT_STATES.CLOSED})
    const result = deleteProject(project.id)
    return expect(result).to.eventually.be.rejectedWith(/Project can only be deleted if still in progress/i)
  })
})
