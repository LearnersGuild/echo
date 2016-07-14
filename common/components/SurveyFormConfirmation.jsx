import React, {PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'

function SurveyFormConfirmation(props) {
  return (
    <div>
      <section>{props.header}</section>

      <section>{props.message}</section>

      <section>
        <Button
          label={props.closeLabel || 'Close'}
          disabled={props.closeDisabled}
          onMouseUp={props.onClose}
          raised
          primary
          />
      </section>
    </div>
  )
}

SurveyFormConfirmation.propTypes = {
  header: PropTypes.any,
  message: PropTypes.string,
  onClose: PropTypes.func,
  closeLabel: PropTypes.string,
  closeDisabled: PropTypes.bool,
}

export default SurveyFormConfirmation
