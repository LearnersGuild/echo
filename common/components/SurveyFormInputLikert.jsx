import React, {PropTypes} from 'react'
import {RadioGroup, RadioButton} from 'react-toolbox/lib/radio'

// TODO: support variable number of agreement options
import {LIKERT_7_AGREEMENT_OPTIONS} from '../models/survey'

class SurveyFormInputLikert extends React.Component {
  constructor(props) {
    super(props)
    this.handleUpdate = this.handleUpdate.bind(this)
  }

  handleUpdate(val) {
    if (this.props.onChange) {
      this.props.onChange(val)
    }
  }

  render() {
    return (
      <section>
        <RadioGroup value={parseInt(this.props.value, 10)} onChange={this.handleUpdate}>
          {LIKERT_7_AGREEMENT_OPTIONS.map((option, i) => (
            <RadioButton key={i} label={option.label} value={option.value}/>
          ))}
        </RadioGroup>
      </section>
    )
  }
}

SurveyFormInputLikert.propTypes = {
  hint: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
}

export default SurveyFormInputLikert
