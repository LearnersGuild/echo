import React, {PropTypes} from 'react'
import Chip from 'react-toolbox/lib/chip'
import Avatar from 'react-toolbox/lib/avatar'
import Slider from 'react-toolbox/lib/slider'

import {Flex} from './Layout'

import styles from './SurveyFormInputSliderGroup.css'

// TODO: make a pure function
class SurveyFormInputSliderGroup extends React.Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  getTotalForNewValue(newValue, newValueIndex) {
    newValue = parseInt(newValue, 10) || 0

    return this.props.options.reduce((result, option, optionIndex) => {
      result += newValueIndex === optionIndex ? newValue : parseInt((option.value || 0), 10)
      return result
    }, 0)
  }

  sliderPropsForOption(option) {
    return {
      min: 0,
      max: this.props.maxTotal,
      step: 1,
      value: parseInt(option.value || 0, 10),
    }
  }

  handleInputChange(value, index) {
    const {options, maxTotal} = this.props
    const newValue = parseInt(value, 10)
    const newTotal = this.getTotalForNewValue(newValue, index)

    if (!isNaN(maxTotal) && newTotal > maxTotal) {
      return
    }

    if (options[index] && this.props.onChange) {
      this.props.onChange(value, options[index].payload)
    } else {
      console.error(`Option input not found for updated value ${value} at index ${index}`)
    }
  }

  renderOptionSubject(option, i) {
    return (
      <Flex key={i} className={styles.inputContainer} alignItems="center">
        <Chip className={styles.subjectChip}>
          <Flex alignItems="center" height="100%">
            {this.renderSliderAvatar(option)}
            <span>{option.label}</span>
          </Flex>
        </Chip>
      </Flex>
    )
  }

  renderOptionSlider(option, i) {
    const sliderProps = this.sliderPropsForOption(option)
    const handleChange = value => this.handleInputChange(value, i)
    return (
      <Flex key={i} className={styles.inputContainer} alignItems="center">
        <Slider {...sliderProps} onChange={handleChange} className={styles.slider}/>
      </Flex>
    )
  }

  renderSliderAvatar(option) {
    if (option.imageUrl) {
      return <Avatar><img src={option.imageUrl}/></Avatar>
    }
    return <Avatar icon="person"/>
  }

  renderOptionPercentage(option, i) {
    return (
      <Flex key={i} className={styles.inputContainer} alignItems="center">
        <h4>{`${parseInt(option.value || 0, 10)}%`}</h4>
      </Flex>
    )
  }

  render() {
    const subjects = (
      <Flex flexDirection="column" flex={4}>
        {this.props.options.map((option, i) => this.renderOptionSubject(option, i))}
      </Flex>
    )
    const sliders = (
      <Flex flexDirection="column" flex={9}>
        {this.props.options.map((option, i) => this.renderOptionSlider(option, i))}
      </Flex>
    )
    const percentages = (
      <Flex flexDirection="column" flex={1}>
        {this.props.options.map((option, i) => this.renderOptionPercentage(option, i))}
      </Flex>
    )

    return (
      <section>
        <p>{this.props.prompt}</p>
        <div>
          <Flex width="100%">
            {subjects}
            {sliders}
            {percentages}
          </Flex>
        </div>
      </section>
    )
  }
}

SurveyFormInputSliderGroup.propTypes = {
  prompt: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    imageUrl: PropTypes.string,
    value: PropTypes.any,
    payload: PropTypes.any,
  })),
  maxTotal: PropTypes.number,
  onChange: PropTypes.func,
}

export default SurveyFormInputSliderGroup
