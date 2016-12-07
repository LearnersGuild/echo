/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import Dialog from 'react-toolbox/lib/dialog'
import {Field} from 'redux-form'

import {renderInput} from 'src/common/util/form'

class InviteCodeForm extends Component {
  render() {
    const {
      handleSubmit,
      submitting,
      invalid,
      pristine,
      isActive,
      onSave,
      onCancel,
    } = this.props

    const actions = [
      {label: 'Cancel', onClick: onCancel},
      {label: 'Create', onClick: handleSubmit(onSave), disabled: pristine || invalid || submitting},
    ]

    return (
      <Dialog actions={actions} active={isActive && !submitting} title="Create Invite Code">
        <form id="inviteCode">
          <Field name="chapterId" component="hidden" type="hidden"/>
          <Field
            name="code"
            type="text"
            label="Code"
            hint="(e.g., oakland-2016-july)"
            component={renderInput}
            required
            />
          <Field
            name="description"
            type="text"
            label="Description"
            component={renderInput}
            required
            />
          <Field
            name="roles"
            type="text"
            label="Roles"
            hint="Assigned to players who join with this code"
            component={renderInput}
            required
            />
        </form>
      </Dialog>
    )
  }
}

InviteCodeForm.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default InviteCodeForm
