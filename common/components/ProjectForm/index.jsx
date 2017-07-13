/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'
import Tooltip from 'react-toolbox/lib/tooltip'
import {Field} from 'redux-form'
import Helmet from 'react-helmet'

import ConfirmationDialog from 'src/common/components/ConfirmationDialog'
import ContentHeader from 'src/common/components/ContentHeader'
import NotFound from 'src/common/components/NotFound'
import WrappedButton from 'src/common/components/WrappedButton'
import {Flex} from 'src/common/components/Layout'
import {FORM_TYPES, renderInput} from 'src/common/util/form'

import styles from './index.scss'

const TooltipButton = Tooltip(WrappedButton) // eslint-disable-line new-cap

class ProjectForm extends Component {
  constructor(props) {
    super(props)
    this.handleClickDelete = this.handleClickDelete.bind(this)
    this.handleClickDeleteCancel = this.handleClickDeleteCancel.bind(this)
    this.handleClickDeleteConfirm = this.handleClickDeleteConfirm.bind(this)
    this.state = {showDeleteDialog: false}
  }

  handleClickDelete() {
    this.setState({showDeleteDialog: true})
  }

  handleClickDeleteCancel() {
    this.setState({showDeleteDialog: false})
  }

  handleClickDeleteConfirm() {
    this.props.onDelete()
  }

  render() {
    const {
      pristine,
      handleSubmit,
      submitting,
      invalid,
      formType,
      onSave,
      project,
    } = this.props

    if (formType === FORM_TYPES.NOT_FOUND) {
      return <NotFound/>
    }

    const projectName = project ? project.name : null

    const submitDisabled = Boolean(pristine || submitting || invalid)
    const deleteDisabled = project ? Boolean(project.retrospectiveSurveyId) : true
    const deleteDisabledTooltip = deleteDisabled ? 'Cannot delete a project that is not in progress' : null

    const title = formType === FORM_TYPES.CREATE ? 'Create Project' : `Edit ${projectName}`

    const deleteConfirmationDialog = FORM_TYPES.UPDATE ? (
      <ConfirmationDialog
        active={this.state.showDeleteDialog}
        confirmLabel="Yes, Delete"
        onClickCancel={this.handleClickDeleteCancel}
        onClickConfirm={this.handleClickDeleteConfirm}
        title=" "
        >
        <Flex className={styles.confirmation} justifyContent="center" alignItems="center">
          Delete #{projectName}?
        </Flex>
      </ConfirmationDialog>
    ) : null

    const deleteButton = FORM_TYPES.UPDATE ? (
      <TooltipButton
        label="Delete"
        disabled={deleteDisabled}
        onClick={this.handleClickDelete}
        tooltip={deleteDisabledTooltip}
        tooltipDelay={1000}
        accent
        raised
        />
    ) : <div/>

    return (
      <Flex column>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <ContentHeader title={title}/>
        <form id="project" onSubmit={handleSubmit(onSave)}>
          <Field name="projectIdentifier" type="hidden" component="hidden"/>
          <Field
            name="chapterIdentifier"
            type="text"
            icon="home"
            label="Chapter Name"
            hint={'e.g. "Oakland"'}
            component={renderInput}
            required
            />
          <Field
            name="cycleIdentifier"
            type="text"
            icon="access_time"
            label="Cycle Number"
            hint={'e.g. "21"'}
            component={renderInput}
            required
            />
          <Field
            name="goalIdentifier"
            type="text"
            icon="track_changes"
            label="Goal Number"
            hint={'e.g. "77"'}
            component={renderInput}
            required
            />
          <Field
            name="memberIdentifiers"
            type="text"
            icon="people"
            hint={'Separate by commas (e.g. "ltuhura, mrspock, scotty")'}
            label="Member Handles"
            component={renderInput}
            required
            />
          <Flex className={styles.footer} justifyContent="space-between">
            {deleteButton}
            <Button
              type="submit"
              label="Save"
              disabled={submitDisabled}
              primary
              raised
              />
          </Flex>
        </form>
        {deleteConfirmationDialog}
      </Flex>
    )
  }
}

ProjectForm.propTypes = {
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  formType: PropTypes.oneOf(Object.values(FORM_TYPES)).isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  project: PropTypes.object,
}

export default ProjectForm
