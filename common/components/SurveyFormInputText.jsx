import React, {PropTypes} from 'react'
import Input from 'react-toolbox/lib/input'

class SurveyFormInputText extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(val) {
    if (this.props.onChange) {
      this.props.onChange(val)
    }
  }

  render() {
    return (
      <section>
        <p>{this.props.prompt}</p>

        <Input
          type="text"
          hint={this.props.hint}
          value={this.props.value}
          onChange={this.handleChange}
          multiline
          floating
          />
      </section>
    )
  }
}

SurveyFormInputText.propTypes = {
  prompt: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
}

export default SurveyFormInputText
