/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/**
 * FIXME: Temporarily disabling tests that require a full mount due to:
 * https://github.com/erikras/redux-form/issues/849
 */
import React from 'react'
import {shallow, mount} from 'enzyme'

import ChapterForm from 'src/common/components/ChapterForm'

describe(testContext(__filename), function () {
  before(function () {
    const mockField = {
      defaultValue: null,
      initialValue: null,
      invalid: false,
    }

    const changeField = name => {
      return () => {
        this.fieldsChanged[name] = true
      }
    }

    this.fieldsChanged = {
      id: false,
      name: false,
      channelName: false,
      timezone: false,
      goalRepositoryURL: false,
    }

    this.mockFields = {
      id: Object.assign({}, mockField, {name: 'id', onChange: changeField('id')}),
      name: Object.assign({}, mockField, {name: 'name', onChange: changeField('name')}),
      channelName: Object.assign({}, mockField, {name: 'channelName', onChange: changeField('channelName')}),
      timezone: Object.assign({}, mockField, {name: 'timezone', onChange: changeField('timezone')}),
      goalRepositoryURL: Object.assign({}, mockField, {name: 'timezone', onChange: changeField('goalRepositoryURL')}),
    }

    this.mockAuth = {
      currentUser: {
        id: 'abcd1234',
        email: 'me@example.com',
        emails: ['me@example.com', 'me2@example.com'],
        handle: 'me',
        name: 'Me',
        phone: null,
        dateOfBirth: null,
        timezone: null,
      },
    }

    this.getProps = customProps => {
      const baseProps = {
        handleSubmit: () => null,
        submitting: false,
        submitFailed: false,
        formType: 'update',
        showCreateInviteCode: false,
        onSaveInviteCode: () => null,
        onSaveChapter: () => null,
        change: () => null,
        auth: Object.assign({}, this.mockAuth),
        formValues: Object.assign({}, this.mockFields),
        invalid: false,
        pristine: true,
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('interactions', function () {
    it.skip('updates fields when they are changed', function () {
      const changesToTest = {
        id: true,
        name: true,
        channelName: true,
      }

      const props = this.getProps()
      const root = mount(React.createElement(ChapterForm, props))
      const inputs = root.find('ThemedInput')

      inputs.forEach(input => {
        if (changesToTest[input.props().name]) {
          input.simulate('change')
        }
      })

      Object.keys(changesToTest).forEach(fieldName => {
        expect(this.fieldsChanged[fieldName]).to.equal(true)
      })
    })

    it.skip('submit button is disabled if the form has errors', function () {
      const props = this.getProps({
        invalid: true,
      })

      const root = mount(React.createElement(ChapterForm, props))
      const submitButton = root.findWhere(node => {
        return node.name() === 'Button' && node.props().type === 'submit'
      }).first()

      expect(submitButton.props().disabled).to.equal(true)
    })

    it.skip('submit button is enabled if there are no errors', function () {
      const root = mount(React.createElement(ChapterForm, this.getProps()))
      const submitButton = root.findWhere(node => {
        return node.name() === 'Button' && node.props().type === 'submit'
      }).first()

      expect(submitButton.props().disabled).to.equal(false)
    })

    it('handles form submission', function () {
      let submitted = false
      const props = this.getProps({
        handleSubmit: () => {
          submitted = true
        },
      })

      const root = shallow(React.createElement(ChapterForm, props))
      root.find('form').simulate('submit')

      expect(submitted).to.equal(true)
    })
  })

  describe('rendering', function () {
    it('displays not found message if formType is "notfound"', function () {
      const props = this.getProps({formType: 'notfound'})
      const root = shallow(React.createElement(ChapterForm, props))

      expect(root.html()).to.match(/not found/i)
    })
  })
})
