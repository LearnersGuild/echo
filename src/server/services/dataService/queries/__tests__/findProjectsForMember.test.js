/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import findProjectsForMember from '../findProjectsForMember'

describe(testContext(__filename), function () {
  useFixture.setCurrentCycleAndMemberForProject()

  beforeEach(resetDB)

  beforeEach(async function () {
    this.chapter = await factory.create('chapter')
    this.memberProject = await factory.create('project', {chapterId: this.chapter.id})
    await this.setCurrentCycleAndMemberForProject(this.memberProject)
    this.otherProject = await factory.create('project', {chapterId: this.chapter.id})
  })

  it('returns the projects for the given member', async function () {
    const projectIds = (await findProjectsForMember(this.currentUser.id)).map(p => p.id)
    return expect(projectIds).to.deep.equal([this.memberProject.id])
  })

  it('does not return projects with which the member is not involved', async function () {
    const projectIds = (await findProjectsForMember(this.currentUser.id)).map(p => p.id)
    return expect(projectIds).to.not.contain(this.otherProject.id)
  })
})
