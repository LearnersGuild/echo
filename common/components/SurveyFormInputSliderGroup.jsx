import React, {PropTypes} from 'react'
import Chip from 'react-toolbox/lib/chip'
import Avatar from 'react-toolbox/lib/avatar'
import Slider from 'react-toolbox/lib/slider'

import {Flex} from './Layout'

import styles from './SurveyFormInputSliderGroup.css'

class SurveyFormInputSliderGroup extends React.Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  sliderPropsForOption(option) {
    const {maxTotal} = this.props

    let currentTotal = 0
    this.props.options.forEach(input => {
      currentTotal += (input.value || 0)
    })

    return {
      min: 0,
      max: isNaN(maxTotal) ? null : (maxTotal - currentTotal),
      step: 1,
      value: option.value || 0,
    }
  }

  handleInputChange(value, index) {
    if (this.props.options[index] && this.props.onChange) {
      this.props.onChange(value, this.props.options[index].payload)
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

  render() {
    const subjects = (
      <Flex flexDirection="column" flex={1}>
        {this.props.options.map((option, i) => this.renderOptionSubject(option, i))}
      </Flex>
    )
    const sliders = (
      <Flex flexDirection="column" flex={2}>
        {this.props.options.map((option, i) => this.renderOptionSlider(option, i))}
      </Flex>
    )

    return (
      <section>
        <p>{this.props.prompt}</p>
        <div>
          <Flex width="100%">
            {subjects}
            {sliders}
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
