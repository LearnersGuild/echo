import React, {PropTypes} from 'react'
import {connect} from 'react-redux'

import {dismissError} from 'src/common/actions/error'
import Error from 'src/common/components/Error'

export function renderErrors({dispatch, errors}) {
  const theErrors = errors.messages.map((message, i) => {
    const handleDismiss = () => {
      dispatch(dismissError(i))
    }
    return (
      <Error key={i} onDismiss={handleDismiss} message={message}/>
    )
  })

  return (
    <section>
      {theErrors}
    </section>
  )
}

renderErrors.propTypes = {
  errors: PropTypes.shape({
    messages: PropTypes.array.isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
}

function mapStateToProps(state) {
  return {
    errors: state.errors,
  }
}

export default connect(mapStateToProps)(renderErrors)
