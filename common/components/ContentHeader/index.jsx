import React, {PropTypes} from 'react'
import {IconButton} from 'react-toolbox/lib/button'

import {Flex} from 'src/common/components/Layout'

import styles from './index.scss'

export default function ContentHeader(props) {
  const {title, subtitle, buttonIcon, onClickButton} = props
  const actionButton = buttonIcon || onClickButton ? (
    <IconButton
      icon={buttonIcon}
      onClick={onClickButton}
      primary
      />
  ) : null

  const headerTitle = React.isValidElement(title) ? title : (
    <h5>{title}</h5>
  )
  const headerSubtitle = React.isValidElement(subtitle) ? subtitle : (
    <div>{subtitle}</div>
  )

  return (
    <Flex className={styles.contentHeader} column>
      <Flex className={styles.contentHeaderTitle} alignItems="center">
        {headerTitle}
        {actionButton}
      </Flex>
      <Flex className={styles.contentHeaderSubtitle} alignItems="center">
        {headerSubtitle}
      </Flex>
    </Flex>
  )
}

ContentHeader.propTypes = {
  title: PropTypes.any,
  subtitle: PropTypes.any,
  buttonIcon: PropTypes.string,
  onClickButton: PropTypes.func,
}
