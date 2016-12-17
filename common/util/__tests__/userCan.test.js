/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import userCan from 'src/common/util/userCan'

describe(testContext(__filename), function () {
  it('returns false if user is null or undefined', function () {
    expect(userCan(null, 'createCycle')).to.not.be.ok
  })

  it('returns false if the user has no roles', async function () {
    const user = await factory.build('user', {roles: []})
    expect(userCan(user, 'createCycle')).to.not.be.ok
  })

  it('throws if an invalid capability is given', async function () {
    const user = await factory.build('user')
    expect(() => userCan(user, 'goToTheBathroom')).to.throw(/No such capability/)
  })

  it('returns false if none of the roles for the user have the given capability', async function () {
    const user = await factory.build('user', {roles: ['player']})
    expect(userCan(user, 'createCycle')).to.not.be.ok
  })

  it('returns true if at least one of the roles for the user has the given capability', async function () {
    const user = await factory.build('user', {roles: ['backoffice']})
    expect(userCan(user, 'createCycle')).to.be.ok
  })
})
