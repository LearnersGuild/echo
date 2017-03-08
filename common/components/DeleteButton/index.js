import React, {Component, PropTypes} from 'react'
import Button from 'react-toolbox/lib/button/Button'
import Dialog from 'react-toolbox/lib/dialog'

import styles from './index.scss'

export default class DeleteButton extends Component {
  constructor() {
    super()
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(e) {
    if (e) {
      e.preventDefault()
    }
    this.props.onClick(this.props.project)
  }

  render() {
    const {
      children,
      onDeleteProject,
      showingDeleteDialog,
      project
    } = this.props

    return (
      <div>
        <Button icon="delete" className={styles.button} onClick={this.handleClick}>
          {children}
        </Button>
        <Dialog
          actions={[
            {label: 'Cancel', onClick: this.handleClick},
            {label: 'Delete', onClick: onDeleteProject}
          ]}
          active={showingDeleteDialog}
          onEscKeyDown={this.handleClick}
          onOverlayClick={this.handleClick}
          className={styles.dialog}
          title="Confirm Delete"
          >
          <div>Are you sure you want to delete {project.name}?</div>
        </Dialog>
      </div>
    )
  }
}

DeleteButton.propTypes = {
  onClick: PropTypes.func,
  project: PropTypes.object,
  children: PropTypes.any,
  onDeleteProject: PropTypes.func,
  showingDeleteDialog: PropTypes.bool,
}
