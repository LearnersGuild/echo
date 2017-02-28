/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'
import {getUserById} from 'src/server/db/user'
import {processUserCreated} from 'src/server/workers/userCreated'

describe(testContext(__filename), function() {
  withDBCleanup()
  
  describe('processUserCreated', function() {
    describe('when a user is created', function() {
      beforeEach(async function() {
        console.log('herezzzss')
        this.chapter = await factory.create('chapter', {
          inviteCodes: ['test']
        })
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 3,
        })
        console.log('this.chapter', this.chapter, 'this.cycle', this.cycle)
        this.player = await factory.create('player')
        console.log('this.player', this.player)
        this.user = await factory.build('user')
        console.log('this.user', this.user)
      })

      it('inserts a user into the database', async function() {
        console.log('this.user', this.user)
        await processUserCreated(this.user)
        expect(getUserById(this.user.id)).to.not.be.null
      })
    })
  })
})
