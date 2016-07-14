/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import Dialog from 'react-toolbox/lib/dialog'
import Input from 'react-toolbox/lib/input'

class InviteCodeForm extends Component {
  render() {
    const {
      fields: {chapterId, code, description, roles},
      handleSubmit,
      submitting,
      isActive,
      onCancel,
    } = this.props

    const actions = [
      {label: 'Cancel', onClick: onCancel},
      {label: 'Create', onClick: handleSubmit},
    ]

    return (
      <Dialog actions={actions} active={isActive && !submitting} title="Create Invite Code">
        <form id="inviteCode">
          <Input
            type="hidden"
            {...chapterId}
            />
          <Input
            type="text"
            label="Code (e.g., oakland-2016-july)"
            {...code}
            error={code.dirty ? code.error : null}
            />
          <Input
            type="text"
            label="Description"
            {...description}
            error={description.dirty ? description.error : null}
            />
          <Input
            type="text"
            label="Roles (will be assigned to players who join with this code)"
            {...roles}
            error={roles.dirty ? roles.error : null}
            />
        </form>
      </Dialog>
    )
  }
}

InviteCodeForm.propTypes = {
  errors: PropTypes.object.isRequired,
  fields: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  isActive: PropTypes.bool.isRequired,
  defaultRoles: PropTypes.array,
  onCancel: PropTypes.func.isRequired,
}

export default InviteCodeForm
