/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery, mockIdmUsersById} from 'src/test/helpers'

import fields from '../index'

const query = `
  query($identifiers: [String]) {
    findMembers(identifiers: $identifiers) {
      id name handle avatarUrl
      chapter { id name }
      phase { id number }
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Setup', async function () {
    this.currentUser = await factory.build('user')
    this.chapter = await factory.create('chapter')
    this.phase = await factory.create('phase')
    this.members = await factory.createMany('member', 3, {phaseId: this.phase.id, chapterId: this.chapter.id})
    this.users = await mockIdmUsersById(this.members.map(m => m.id))
    await factory.createMany('member', 5) // extra members
  })

  it('returns correct members for identifiers with chapters and phases', async function () {
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifiers: this.members.map(m => m.handle)},
      {currentUser: this.currentUser},
    )
    expect(result.data.findMembers.length).to.equal(this.members.length)
    const inputUser = this.users[0]
    const inputMember = this.members[0]
    const fetchedMember = result.data.findMembers.find(m => m.id === inputUser.id)
    expect(fetchedMember.id).to.equal(inputUser.id)
    expect(fetchedMember.name).to.equal(inputUser.name)
    expect(fetchedMember.avatarUrl).to.equal(inputUser.avatarUrl)
    expect(fetchedMember.chapter.id).to.equal(inputMember.chapterId)
    expect(fetchedMember.phase.id).to.equal(inputMember.phaseId)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, null, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
