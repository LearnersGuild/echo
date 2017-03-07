/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import moment from 'moment-timezone'
import {Field} from 'redux-form'
import {Button} from 'react-toolbox/lib/button'
import Input from 'react-toolbox/lib/input'
import Dropdown from 'react-toolbox/lib/dropdown'

import InviteCodeForm from 'src/common/containers/InviteCodeForm'
import ContentHeader from 'src/common/components/ContentHeader'
import NotFound from 'src/common/components/NotFound'
import {Flex} from 'src/common/components/Layout'
import {FORM_TYPES, renderInput} from 'src/common/util/form'
import {slugify} from 'src/common/util'

import styles from './index.scss'
import theme from './theme.scss'

class ChapterForm extends Component {
  constructor() {
    super()
    this.state = {inviteCodeDialogActive: false}
    this.showInviteCodeDialog = this.showInviteCodeDialog.bind(this)
    this.hideInviteCodeDialog = this.hideInviteCodeDialog.bind(this)
    this.handleSaveInviteCode = this.handleSaveInviteCode.bind(this)
    this.handleChangeName = this.handleChangeName.bind(this)
    this.handleChangeTimezone = this.handleChangeTimezone.bind(this)
    this.generateTimezoneDropdownValues()
  }

  generateTimezoneDropdownValues() {
    // const now = new Date()
    this.timezones = moment.tz.names().map(zoneName => {
      // const zone = moment.tz.zone(zoneName)
      // const hoursOffset = zone.offset(now) / 60
      // const plusMinus = hoursOffset >= 0 ? '+' : '-'

      return {
        value: zoneName,
        label: zoneName,
        // TODO: ideally, we'd use the string below for the label, but this bug
        // (https://github.com/react-toolbox/react-toolbox/issues/836) prevents it
        //
        // label: `${zoneName} (UTC${plusMinus}${Math.abs(hoursOffset)})`
      }
    })
  }

  showInviteCodeDialog(e) {
    e.preventDefault()
    this.setState({inviteCodeDialogActive: true})
  }

  hideInviteCodeDialog(e) {
    e.preventDefault()
    this.setState({inviteCodeDialogActive: false})
  }

  handleSaveInviteCode(inviteCodeFormData) {
    this.setState({inviteCodeDialogActive: false})
    this.props.onSaveInviteCode(inviteCodeFormData)
  }

  handleChangeName(event, newValue) {
    this.props.change('name', event)
    this.props.change('channelName', slugify(newValue || ''))
  }

  handleChangeTimezone(value) {
    this.props.change('timezone', value)
  }

  renderInviteCodeDialog() {
    const {formValues = {}, showCreateInviteCode} = this.props
    if (!showCreateInviteCode) {
      return ''
    }
    return (
      <InviteCodeForm
        chapterId={formValues.id}
        isActive={this.state.inviteCodeDialogActive}
        onCancel={this.hideInviteCodeDialog}
        onSave={this.handleSaveInviteCode}
        />
    )
  }

  render() {
    const {
      handleSubmit,
      submitting,
      onSaveChapter,
      formType,
      inviteCodes,
      showCreateInviteCode,
      invalid,
      pristine,
      formValues,
    } = this.props

    if (formType === FORM_TYPES.NOT_FOUND) {
      return <NotFound/>
    }

    let inviteCodeField
    let createInviteCodeButton
    if (showCreateInviteCode && formType === FORM_TYPES.UPDATE) {
      inviteCodeField = (
        <Input
          type="text"
          icon="mail_outline"
          label="Invite Codes"
          value={inviteCodes.join('\n')}
          theme={theme}
          multiline
          disabled
          />
      )

      createInviteCodeButton = (
        <Button
          className={styles.inviteButton}
          icon="add"
          label="Create Invite Code"
          accent
          raised
          onClick={this.showInviteCodeDialog}
          />
      )
    }

    const title = formType === FORM_TYPES.CREATE ?
      'Create Chapter' :
      `Edit Chapter: ${formValues.name}`

    return (
      <div>
        <ContentHeader title={title}/>
        <form id="chapter" onSubmit={handleSubmit(onSaveChapter)}>
          <Field name="id" type="hidden" component="hidden"/>
          <Field
            name="name"
            type="text"
            icon="title"
            label="Name"
            component={renderInput}
            onChange={this.handleChangeName}
            required
            />
          <Field
            name="channelName"
            type="text"
            icon="chat"
            label="Chat Channel Name"
            component={renderInput}
            disabled
            required
            />
          <Dropdown
            icon="flag"
            label="Timezone"
            source={this.timezones}
            value={formValues.timezone}
            onChange={this.handleChangeTimezone}
            required
            />
          <Field
            name="goalRepositoryURL"
            type="text"
            icon="link"
            label="Goal Repository URL"
            hint="https://github.com/GuildCrafts/awesome-stuffs"
            component={renderInput}
            required
            />
          {inviteCodeField}
          <Flex justifyContent="flex-end">
            {createInviteCodeButton}
            <Button
              type="submit"
              label="Save"
              disabled={pristine || invalid || submitting}
              primary
              raised
              />
          </Flex>
        </form>
        {this.renderInviteCodeDialog()}
      </div>
    )
  }
}

ChapterForm.propTypes = {
  formValues: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  change: PropTypes.func.isRequired,
  invalid: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  pristine: PropTypes.bool.isRequired,
  formType: PropTypes.oneOf(Object.values(FORM_TYPES)).isRequired,
  inviteCodes: PropTypes.array.isRequired,
  showCreateInviteCode: PropTypes.bool.isRequired,
  onSaveChapter: PropTypes.func.isRequired,
  onSaveInviteCode: PropTypes.func.isRequired,
}

export default ChapterForm
