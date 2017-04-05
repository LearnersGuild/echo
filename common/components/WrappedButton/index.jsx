import React, {Component, PropTypes} from 'react'

import Button from 'react-toolbox/lib/button'

export default class WrappedButton extends Component {
  render() {
    return (
      <div
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        >
        <Button {...this.props}/>
      </div>
    )
  }
}

WrappedButton.propTypes = {
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
}
