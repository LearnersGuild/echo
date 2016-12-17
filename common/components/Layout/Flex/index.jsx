/**
 * Flex.js
 * Dumber but more compatible alternative to jsxstyle.
 *
 * Usage:
 * <Flex flexDirection="column"><MyComponent/></Flex>
 * <Flex justifyContent="center" row><MyComponent/></Flex>
 * <Flex fill column><MyComponent/></Flex>
 */
import React, {Component, PropTypes} from 'react'

import styles from './index.scss'

class Flex extends Component {
  render() {
    const classNames = Object.keys(this.props)
      .reduce((result, propName) => {
        const propValue = this.props[propName]
        if (propValue) {
          if (typeof propValue === 'string') {
            result.push(`${propName}_${propValue}`) // ex: flexDirection="column"
          } else {
            result.push(propName)                   // ex: row={true}
          }
        }
        return result
      }, ['flex'])
      .map(className => styles[className])

    if (this.props.className) {
      classNames.push(this.props.className)
    }

    return (
      <div className={classNames.join(' ')}>
        {this.props.children}
      </div>
    )
  }
}

Flex.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
}

export default Flex
