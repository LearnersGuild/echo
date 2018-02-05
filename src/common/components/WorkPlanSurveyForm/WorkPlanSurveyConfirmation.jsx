import React, {PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'

export default function WorkPlanSurveyConfirmation(props) {
  const {
    onClickBack
  } = props

  const buttonStyle = {
    marginTop: '20px'
  }

  return (
    <div>
      <h2>You have successfully submitted your work plan.</h2>
      <Button onClick={onClickBack} style={buttonStyle} raised>
        <FontIcon value="keyboard_arrow_left"/>
        <span>Edit</span>
      </Button>
    </div>
  )
}

WorkPlanSurveyConfirmation.propTypes = {
  onClickBack: PropTypes.func.isRequired
}
