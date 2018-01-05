/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {mount} from 'enzyme'

import UserList from 'src/common/components/UserList'

describe(testContext(__filename), function () {
  before(function () {
    const userModel = {
      handle: {type: String},
      name: {type: String},
      chapterName: {title: 'Chapter', type: String},
      phaseName: {title: 'Phase', type: String},
      email: {type: String},
      active: {type: String},
    }
    const userData = [
      {
        name: 'Ivanna Lerntokode',
        handle: 'ivannalerntokode',
        chapterName: 'Over the Rainbow',
        phaseName: 'Apprenticeship',
        email: 'walks@thebeach',
        active: 'Yes',
      },
      {
        name: 'Already Lerndtokode!',
        handle: 'alreadylerndtokode',
        chapterName: 'Under the Rainbow',
        phaseName: 'Practice',
        email: 'swims@thepool',
        active: 'Yes',
      }
    ]
    this.getProps = customProps => {
      return Object.assign({userData, userModel}, customProps || {})
    }
  })

  describe('rendering', function () {
    it('renders all the users', function () {
      const props = this.getProps()
      const root = mount(React.createElement(UserList, props))
      const userRows = root.find('TableRow')
      const numberOfAddedRows = 1

      expect(userRows.length - numberOfAddedRows).to.equal(props.userData.length)
    })
  })
})
