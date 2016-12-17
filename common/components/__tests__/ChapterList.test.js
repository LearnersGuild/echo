/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import factory from 'src/test/factories'
import ChapterList from 'src/common/components/ChapterList'

describe(testContext(__filename), function () {
  before(async function () {
    const chapters = await factory.buildMany('chapter', 3)
    this.getProps = customProps => {
      const baseProps = {
        chapters,
        onSelectRow: () => null,
        onClickCreate: () => null,
        allowSelect: false,
        allowCreate: false,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it('onClickCreate is invoked when create button is clicked', function () {
      let clicked = false
      const props = this.getProps({
        allowCreate: true,
        onClickCreate: () => {
          clicked = true
        },
      })

      const root = mount(React.createElement(ChapterList, props))
      root.find('button')
        .first()
        .simulate('click')

      expect(clicked).to.equal(true)
    })

    it('onSelectRow is invoked when row is selected is allowSelect is true', function () {
      let clicked = false
      const props = this.getProps({
        allowSelect: true,
        onSelectRow: () => {
          clicked = true
        },
      })

      const root = mount(React.createElement(ChapterList, props))
      root.find('Table')
        .children()
        .find('td')
        .first()
        .simulate('click')

      expect(clicked).to.equal(true)
    })

    it('onSelectRow is invoked when row is selected is allowSelect is false', function () {
      let clicked = false
      const props = this.getProps({
        onSelectRow: () => {
          clicked = true
        },
      })

      const root = mount(React.createElement(ChapterList, props))
      root.find('Table')
        .children()
        .find('td')
        .first()
        .simulate('click')

      expect(clicked).to.equal(false)
    })
  })

  describe('rendering:', function () {
    it('renders create button if allowCreate is true', function () {
      const root = mount(React.createElement(ChapterList, this.getProps({allowCreate: true})))
      const buttons = root.find('button')
      expect(buttons.length).to.equal(1)
    })

    it('does not render create button if allowCreate is false', function () {
      const root = mount(React.createElement(ChapterList, this.getProps({allowCreate: false})))
      const buttons = root.find('button')
      expect(buttons.length).to.equal(0)
    })

    it('renders "no chapters" message if there are no chapters.', function () {
      const root = shallow(React.createElement(ChapterList, this.getProps({chapters: []})))
      expect(root.html()).to.match(/no chapters/i)
    })
  })
})
