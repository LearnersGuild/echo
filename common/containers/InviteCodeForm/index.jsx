import {reduxForm} from 'redux-form'
import {connect} from 'react-redux'

import InviteCodeFormComponent from 'src/common/components/InviteCodeForm'
import {inviteCodeSchema, validationErrorToReduxFormErrors} from 'src/common/validations'

const FORM_NAME = 'inviteCode'

function asyncValidate(values) {
  const inviteCode = Object.assign({}, values, {roles: values.roles.split(/\W+/)})
  return inviteCodeSchema.validate(inviteCode, {abortEarly: false})
    .then(() => {})
    .catch(err => {
      throw validationErrorToReduxFormErrors(err)
    })
}

function mapStateToProps(state, props) {
  return {
    initialValues: {chapterId: props.chapterId, roles: 'player'},
    isActive: props.isActive,
    onSave: props.onSave,
    onCancel: props.onCancel,
  }
}

const formOptions = {
  form: FORM_NAME,
  asyncBlurFields: ['code', 'description', 'roles'],
  asyncValidate,
}

export default connect(mapStateToProps)(reduxForm(formOptions)(InviteCodeFormComponent))
