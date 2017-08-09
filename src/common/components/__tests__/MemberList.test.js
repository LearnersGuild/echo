/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {mount} from 'enzyme'

import MemberList from 'src/common/components/MemberList'

describe(testContext(__filename), function () {
  before(function () {
    const tableModel = {
      handle: {type: String},
      name: {type: String},
      chapterName: {title: 'Chapter', type: String},
      phaseNumber: {title: 'Phase', type: Number},
      email: {type: String},
      active: {type: String},
    }
    const tableSource = [
      {
        name: 'Ivanna Lerntokode',
        handle: 'ivannalerntokode',
        chapterName: 'Over the Rainbow',
        phaseNumber: 4,
        email: 'walks@thebeach',
        active: 'Yes',
      },
      {
        name: 'Already Lerndtokode!',
        handle: 'alreadylerndtokode',
        chapterName: 'Under the Rainbow',
        phaseNumber: 3,
        email: 'swims@thepool',
        active: 'Yes',
      }
    ]
    this.getProps = customProps => {
      return Object.assign({tableSource, tableModel}, customProps || {})
    }
  })

  describe('rendering', function () {
    it('renders all the members', function () {
      const props = this.getProps()
      const root = mount(React.createElement(MemberList, props))
      const memberRows = root.find('TableRow')
      expect(memberRows.length).to.equal(props.tableSource.length)
    })
  })
})
