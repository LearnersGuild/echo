import React, {PropTypes} from 'react'
import {RadioGroup, RadioButton} from 'react-toolbox/lib/radio'

// TODO: support variable number of agreement options
const AGREEMENT_OPTIONS = [
  {value: 1, label: 'strongly disagree'},
  {value: 2, label: 'disagree'},
  {value: 3, label: 'somewhat disagree'},
  {value: 4, label: 'neutral agree'},
  {value: 5, label: 'somewhat agree'},
  {value: 6, label: 'agree'},
  {value: 7, label: 'strongly agree'},
  {value: 0, label: 'not enough information'},
]

class SurveyFormInputLikert extends React.Component {
  constructor(props) {
    super(props)
    this.handleUpdate = this.handleUpdate.bind(this)
  }

  handleUpdate(val) {
    if (this.props.onChange) {
      console.log('onChange')
      this.props.onChange(val)
    }
  }

  render() {
    return (
      <section>
        <p>{this.props.prompt}</p>

        <RadioGroup value={parseInt(this.props.value, 10)} onChange={this.handleUpdate}>
          {AGREEMENT_OPTIONS.map((option, i) => (
            <RadioButton key={i} label={option.label} value={option.value}/>
          ))}
        </RadioGroup>
      </section>
    )
  }
}

SurveyFormInputLikert.propTypes = {
  prompt: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
}

export default SurveyFormInputLikert
