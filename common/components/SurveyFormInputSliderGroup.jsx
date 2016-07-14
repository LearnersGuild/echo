import React, {PropTypes} from 'react'
import {Chip, Avatar, Slider} from 'react-toolbox/lib/slider'

class SurveyFormInputSliderGroup extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      inputValues: new Map()
    }
  }

  componentWillReceiveMount() {
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
    const {maxTotal = 100} = this.props

    let currentTotal = 0
    this.inputValues.forEach(input => {
      currentTotal += (input.value || 0)
    })

    return {
      min: 0,
      max: maxTotal - currentTotal,
      step: 1,
      value: option.value || 0,
    }
  }

  handleInputChange(value, index) {
    const inputValues = new Map(this.state.inputValues)
    inputValues.set(index, {
      ...this.state.inputValues.get(index),
      value
    })

    if (this.props.onChange) {
      this.props.onChange(inputValues)
    } else {
      this.setState({inputValues})
    }
  }

  renderOptionSubject(option) {
    return (
      <Chip>
        {this.renderSliderAvatar(option)}
        <span>{option.label}</span>
      </Chip>
    )
  }

  renderSliderAvatar(option) {
    if (option.imageUrl) {
      return <Avatar><img src={option.imageUrl}/></Avatar>
    }

    const initial = (option.text || '').charAt(0).toUpperCase()
    if (initial) {
      return <Avatar title={initial}/>
    }

    return <Avatar icon="person"/>
  }

  renderOptionSlider(option, i) {
    const sliderProps = this.sliderPropsForOption(option)
    const handleChange = value => this.handleChange(value, i)
    return (
      <Slider {...sliderProps} onChange={handleChange}/>
    )
  }

  render() {
    return (
      <section>
        <p>{this.props.prompt}</p>

        <div>
          {this.props.options.map((option, i) => (
            <div key={i}>
              {this.renderOptionSubject(option)}
              {this.renderOptionSlider(option, i)}
            </div>
          ))}
        </div>
      </section>
    )
  }
}

SurveyFormInputSliderGroup.propTypes = {
  prompt: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string,
    imageUrl: PropTypes.string,
    value: PropTypes.any,
    payload: PropTypes.any,
  })),
  maxTotal: PropTypes.number,
  onChange: PropTypes.func,
}

export default SurveyFormInputSliderGroup
