import React, {PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'

import {Flex} from 'src/common/components/Layout'

import styles from './index.css'

const SurveyConfirmation = props => {
  return (
    <Flex width="100%" flexDirection="column" className={styles.container}>
      <Flex flexDirection="column" justifyContent="center">
        <h6>{'You\'re all done! Thanks for sharing your feedback.'}</h6>
      </Flex>
      <Flex width="100%" justifyContent="flex-end" className={styles.footer}>
        <Button label={props.label || 'Close'} onMouseUp={props.onClose} disabled={props.disabled} raised primary/>
      </Flex>
    </Flex>
  )
}

SurveyConfirmation.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  onClose: PropTypes.func,
}

export default SurveyConfirmation
