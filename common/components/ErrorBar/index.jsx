import React, {PropTypes} from 'react'
import {Snackbar} from 'react-toolbox'

export default function ErrorBar(props) {
  return (
    <Snackbar
      label={props.message.toString()}
      active
      action="Dismiss"
      icon="error"
      onClick={props.onDismiss}
      type="warning"
      />
  )
}

ErrorBar.propTypes = {
  message: PropTypes.any.isRequired,
  onDismiss: PropTypes.func.isRequired,
}
