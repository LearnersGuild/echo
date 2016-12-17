/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {mount} from 'enzyme'

import UserList from 'src/common/components/UserList'

describe(testContext(__filename), function () {
  before(function () {
    const users = [
      {
        id: 'abcd1234',
        name: 'Ivanna Lerntokode',
        handle: 'ivannalerntokode',
        chapter: {id: 'wxyz9876', name: 'Over the Rainbow'}
      },
      {
        id: 'efgf5678',
        name: 'Already Lerndtokode!',
        handle: 'alreadylerndtokode',
        chapter: {id: '9876wxyz', name: 'Under the Rainbow'}
      }
    ]
    this.getProps = customProps => {
      return Object.assign({users}, customProps || {})
    }
  })

  describe('rendering', function () {
    it('renders all the users', function () {
      const props = this.getProps()
      const root = mount(React.createElement(UserList, props))
      const userRows = root.find('TableRow')

      expect(userRows.length).to.equal(props.users.length)
    })
  })
})
