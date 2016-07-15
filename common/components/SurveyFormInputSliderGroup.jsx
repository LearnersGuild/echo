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
    this.state = {
      inputValues: new Map()
    }
  }

  componentDidMount() {
    const {inputValues} = this.state

    this.setState({
      inputValues: this.options.reduce((result, option, i) => {
        const inputValue = {...option}
        const previousInputValue = inputValues.get(i)
        if (previousInputValue) {
          inputValue.value = previousInputValue.value
        }
        result.set(i, inputValue)
        return result
      }, new Map())
    })
  }

  sliderPropsForOption(option) {
    const {maxTotal} = this.props

    let currentTotal = 0
    this.state.inputValues.forEach(input => {
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
    const inputValues = new Map(this.state.inputValues)
    const input = inputValues.get(index)
    if (input) {
      inputValues.set(index, {...input, value})

      if (this.props.onChange) {
        this.props.onChange(inputValues)
      } else {
        this.setState({inputValues})
      }
    } else {
      console.error(`Input not found for updated value ${value} at index ${index}`)
    }
  }

  renderOptionSubject(option, i) {
    return (
      <Chip key={i}>
        <Flex>
          {this.renderSliderAvatar(option)}
          <span>{option.label}</span>
        </Flex>
      </Chip>
    )
  }

  renderSliderAvatar(option) {
    if (option.imageUrl) {
      return <Avatar><img src={option.imageUrl}/></Avatar>
    }
    return <Avatar icon="person"/>
  }

  renderOptionSlider(option, i) {
    const sliderProps = this.sliderPropsForOption(option)
    const handleChange = value => this.handleInputChange(value, i)
    return <Slider key={i} {...sliderProps} onChange={handleChange}/>
  }

  render() {
    const subjects = (
      <Flex flexDirection="column" flex={1} className={styles.sliderItem}>
        {this.props.options.map((option, i) => this.renderOptionSubject(option, i))}
      </Flex>
    )
    const sliders = (
      <Flex flexDirection="column" flex={2} className={styles.sliderItem}>
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
