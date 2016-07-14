import React, {PropTypes} from 'react'
import {Snackbar} from 'react-toolbox'

export default function error(props) {
  const {onDismiss, message} = props
  return (
    <Snackbar
      label={message.toString()}
      active
      action="Dismiss"
      icon="error"
      onClick={onDismiss}
      type="warning"
      />
  )
}

error.propTypes = {
  message: PropTypes.any.isRequired,
  onDismiss: PropTypes.func.isRequired,
}
