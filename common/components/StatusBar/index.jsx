import React, {PropTypes} from 'react'
import {Snackbar} from 'react-toolbox'

export default function StatusBar(props) {
  return (
    <Snackbar
      label={props.message.toString()}
      active
      action="Dismiss"
      onClick={props.onDismiss}
      type={props.type.toString()}
      />
  )
}

StatusBar.propTypes = {
  message: PropTypes.any.isRequired,
  onDismiss: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
}
