/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import React from 'react'
import {mount} from 'enzyme'
import {assert} from 'chai'

import SurveyFormInputSliderGroup from 'src/common/components/SurveyFormInputSliderGroup'

describe(testContext(__filename), function () {
  // let changed = false
  // let changedValue = null

  const props = {
    name: 'mahSliderGroupInput',
    hint: 'do all the things',
    sum: 200,
    options: [
      {
        key: 'hey',
        label: 'hey',
        tooltip: 'Profile for Hey',
        url: 'http://github.com/hey',
      },
      {
        key: 'ho',
        label: 'ho',
        tooltip: 'Profile for Ho',
        url: 'http://github.com/ho',
      },
    ],
    value: [
      {key: 'hey', value: 150},
    ],
    onChange: (/* value */) => {
      // changed = true
      // changedValue = value
    }
  }

  const root = mount(<SurveyFormInputSliderGroup {...props}/>)
  const sliders = root.find('Slider')
  const sliderLabels = root.find('Chip')

  describe('props.hint', function () {
    it('renders the hint', function () {
      assert.isTrue(root.html().includes(props.hint))
    })
  })

  describe('props.options', function () {
    it('renders as many radio buttons as provided options', function () {
      assert.equal(sliders.length, props.options.length)
    })
  })

  describe('props.options[n]', function () {
    it('renders a label using option.label, option.tooltip, and option.url prop values', function () {
      props.options.forEach((option, i) => {
        const sliderLabel = sliderLabels.at(i)
        const sliderLabelHTML = sliderLabel.html()
        assert.isTrue(sliderLabelHTML.includes(option.label), 'Slider label does not include option label text')
        assert.isTrue(sliderLabelHTML.includes(option.tooltip), 'Slider label does not include option tooltip')
        assert.isTrue(sliderLabelHTML.includes(option.url), 'Slider label does not include option url')
      })
    })
  })

  describe('props.value', function () {
    sliders.forEach((slider, i) => {
      const option = props.options[i]
      const optionValue = props.value.find(optionValue => optionValue.key === option.key)
      const sliderProps = slider.props()

      if (optionValue) {
        it('sets the option slider value if provided', function () {
          assert.equal(sliderProps.value, optionValue.value, 'Slider value is not set to the value privided for the option key')
        })
      } else {
        it('sets the option slider value to 0 if not provided', function () {
          assert.equal(sliderProps.value, 0, 'Slider value is not set to 0 by default')
        })
      }
    })
  })

  describe.skip('props.sum, props.onChange', function () {
    /* FIXME: having trouble figuring out how to properly get the */ // eslint-disable-line no-warning-comments
    /* onChange event handler invoked. simulating a 'change' event */ // eslint-disable-line no-warning-comments
    /* on a <Slider> component doesn't seem to cut it. */ // eslint-disable-line no-warning-comments
    it('passes value to provided callback')
    it('limits sum of value changes to no more than the specified sum')
    it('returns a value for every option, even if some options have a null or 0 value')
  })
})
