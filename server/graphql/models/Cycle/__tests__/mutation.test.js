/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {CYCLE_STATES, PRACTICE, RETROSPECTIVE} from '../../../../../common/models/cycle'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('updateCycleState', function () {
    before(async function () {
      this.user = await factory.build('user', {roles: ['moderator']})
      this.updateCycleState = function (state) {
        return runGraphQLMutation(
          `mutation($state: String!) { updateCycleState(state: $state) { id state } }`,
          fields,
          {state},
          {currentUser: this.user},
        )
      }
    })

    beforeEach(async function () {
      this.moderator = await factory.create('moderator', {id: this.user.id})
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: PRACTICE})
    })

    it('affects the cycle associated with the moderator if no cycle is specified', function () {
      return this.updateCycleState(RETROSPECTIVE)
        .then(() => r.table('cycles').get(this.cycle.id).run())
        .then(updatedCycle => expect(updatedCycle).to.have.property('state', RETROSPECTIVE))
    })

    CYCLE_STATES.filter(state => state !== RETROSPECTIVE).forEach(state => {
      it('returns an error if you try to change into anything but the "next" state', async function () {
        let errorThrown
        try {
          await this.updateCycleState(state)
        } catch (e) {
          errorThrown = e
        }
        expect(errorThrown).to.exist
      })
    })
  })
})
