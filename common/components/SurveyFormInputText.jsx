import React, {PropTypes} from 'react'
import {Input} from 'react-toolbox/lib/input'

function SurveyFormInputText(props) {
  return (
    <section>
      <p>{props.prompt}</p>

      <Input
        type="text"
        hint={props.hint}
        value={props.value}
        onChange={props.onChange}
        multiline
        />
    </section>
  )
}

SurveyFormInputText.propTypes = {
  prompt: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
}

export default SurveyFormInputText
