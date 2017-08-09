/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import findProjectByNameForMember from '../findProjectByNameForMember'

describe(testContext(__filename), function () {
  useFixture.setCurrentCycleAndMemberForProject()

  beforeEach(resetDB)

  beforeEach(async function () {
    this.project = await factory.create('project')
  })

  it('finds the project with the given name where the user is or was a team member', async function () {
    await this.setCurrentCycleAndMemberForProject(this.project)
    const project = await findProjectByNameForMember(this.project.name, this.currentUser.id)
    return expect(project.memberIds).to.contain(this.currentUser.id)
  })

  it('throws an error if the member has never worked on that project', async function () {
    const inactiveMember = await factory.create('member', {chapterId: this.project.chapterId})
    const projectPromise = findProjectByNameForMember(this.project.name, inactiveMember.id)
    return expect(projectPromise).to.be.rejectedWith(/Project.*.not found/)
  })

  it('throws an error if there is no project with the given name', async function () {
    await this.setCurrentCycleAndMemberForProject(this.project)
    const projectPromise = findProjectByNameForMember('non-existent-project-name', this.currentUser.id)
    return expect(projectPromise).to.be.rejectedWith(/Project.*.not found/)
  })
})
