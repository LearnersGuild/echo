/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'
import {Field, FieldArray} from 'redux-form'
import Helmet from 'react-helmet'

import ContentHeader from 'src/common/components/ContentHeader'
import NotFound from 'src/common/components/NotFound'
import {Flex} from 'src/common/components/Layout'
import WrappedButton from 'src/common/components/WrappedButton'
import ConfirmationDialog from 'src/common/components/ConfirmationDialog'
import {FORM_TYPES, renderDropdown, renderCheckboxes} from 'src/common/util/form'

import styles from './index.scss'

class UserForm extends Component {
  constructor(props) {
    super(props)
    this.showDeactivateUserDialog = this.showDeactivateUserDialog.bind(this)
    this.hideDeactivateUserDialog = this.hideDeactivateUserDialog.bind(this)
    this.handleDeactivateUser = this.handleDeactivateUser.bind(this)
    this.showReactivateUserDialog = this.showReactivateUserDialog.bind(this)
    this.hideReactivateUserDialog = this.hideReactivateUserDialog.bind(this)
    this.handleReactivateUser = this.handleReactivateUser.bind(this)
    this.state = {
      showingDeactivateUserDialog: false,
      showingReactivateUserDialog: false
    }
  }

  handleBlurField(event) {
    // blur event handling is causing redux state to not be
    // properly updated with selected options.
    // See: https://github.com/erikras/redux-form/issues/2229
    event.preventDefault()
  }

  showDeactivateUserDialog() {
    this.setState({showingDeactivateUserDialog: true})
  }

  hideDeactivateUserDialog() {
    this.setState({showingDeactivateUserDialog: false})
  }

  showReactivateUserDialog() {
    this.setState({showingReactivateUserDialog: true})
  }

  hideReactivateUserDialog() {
    this.setState({showingReactivateUserDialog: false})
  }

  handleDeactivateUser() {
    const {onDeactivateUser} = this.props
    onDeactivateUser(this.props.user.id)
    this.setState({
      showingDeactivateUserDialog: false
    })
  }

  handleReactivateUser() {
    const {onReactivateUser} = this.props
    onReactivateUser(this.props.user.id)
    this.setState({
      showingReactivateUserDialog: false
    })
  }

  render() {
    const {
      pristine,
      handleSubmit,
      submitting,
      invalid,
      formType,
      onSave,
      user,
      phaseOptions,
      canBeDeactivated,
      canBeReactivated,
      roleOptions,
    } = this.props

    if (formType === FORM_TYPES.NOT_FOUND) {
      return <NotFound/>
    }

    const submitDisabled = Boolean(pristine || submitting || invalid)
    const title = `Edit User: ${user.handle}`

    const deactivateUserDialog = canBeDeactivated ? (
      <ConfirmationDialog
        active={this.state.showingDeactivateUserDialog}
        confirmLabel="Yes, Deactivate"
        onClickCancel={this.hideDeactivateUserDialog}
        onClickConfirm={this.handleDeactivateUser}
        title=" "
        >
        <Flex justifyContent="center" alignItems="center">
          Are you sure you want to deactivate {user.name} ({user.handle})?
        </Flex>
      </ConfirmationDialog>
    ) : null

    const reactivateUserDialog = canBeReactivated ? (
      <ConfirmationDialog
        active={this.state.showingReactivateUserDialog}
        confirmLabel="Yes, Reactivate"
        onClickCancel={this.hideReactivateUserDialog}
        onClickConfirm={this.handleReactivateUser}
        title=" "
        >
        <Flex justifyContent="center" alignItems="center">
          Are you sure you want to reactivate {user.name} ({user.handle})?
        </Flex>
      </ConfirmationDialog>
    ) : null

    const deactivateUserButton = canBeDeactivated ? (
      <WrappedButton
        label="Deactivate"
        disabled={false}
        onClick={this.showDeactivateUserDialog}
        accent
        raised
        />
      ) : null

    const reactivateUserButton = canBeReactivated ? (
      <WrappedButton
        label="Reactivate"
        disabled={false}
        onClick={this.showReactivateUserDialog}
        accent
        raised
        />
      ) : null

    return (
      <Flex column>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <ContentHeader title={title}/>
        <form id="user" onSubmit={handleSubmit(onSave)}>
          <Field name="id" type="hidden" component="hidden"/>
          <Field
            name="phaseNumber"
            type="number"
            icon="trending_up"
            label="Phase Name"
            hint={'e.g. "2"'}
            source={phaseOptions}
            auto
            component={renderDropdown}
            onBlur={this.handleBlurField}
            />
          <FieldArray
            className={styles['roles-container']}
            iconStyle={styles.icon}
            checkBoxStyle={styles.checkbox}
            icon="lock"
            name="roles"
            component={renderCheckboxes}
            labels={roleOptions}
            />
          <Flex className={styles.footer} justifyContent="space-between">
            {deactivateUserButton}
            {reactivateUserButton}
            <Button
              type="submit"
              label="Save"
              disabled={submitDisabled}
              primary
              raised
              />
          </Flex>
        </form>
        {deactivateUserDialog}
        {reactivateUserDialog}
      </Flex>
    )
  }
}

UserForm.propTypes = {
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  formType: PropTypes.oneOf(Object.values(FORM_TYPES)).isRequired,
  onSave: PropTypes.func.isRequired,
  phaseOptions: PropTypes.array,
  user: PropTypes.shape({
    id: PropTypes.string,
    handle: PropTypes.string,
    name: PropTypes.string,
  }),
  onDeactivateUser: PropTypes.func.isRequired,
  onReactivateUser: PropTypes.func.isRequired,
  canBeDeactivated: PropTypes.bool.isRequired,
  canBeReactivated: PropTypes.bool.isRequired,
  roleOptions: PropTypes.array,
}

export default UserForm
