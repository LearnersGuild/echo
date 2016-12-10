import React, {PropTypes} from 'react'

import styles from './index.scss'

function ContentSidebar(props) {
  let headerImage = (
    <img className={styles.image} src={props.imageUrl}/>
  )
  if (props.imageLinkUrl) {
    headerImage = (
      <a href={props.imageLinkUrl}>{headerImage}</a>
    )
  }

  const header = (
    <div className={styles.header}>
      {headerImage}
      <div className={styles.title}>
        <h5>{props.title}</h5>
      </div>
      <div className={styles.subtitle}>
        {props.subtitle}
      </div>
    </div>
  )

  return (
    <div className={styles.sidebar}>
      {header}
      {props.children}
    </div>
  )
}

ContentSidebar.propTypes = {
  imageUrl: PropTypes.string,
  imageLinkUrl: PropTypes.string,
  title: PropTypes.any,
  subtitle: PropTypes.any,
  children: PropTypes.any,
}

export default ContentSidebar
