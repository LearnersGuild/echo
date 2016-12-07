import React, {Component, PropTypes} from 'react'
import {reduxForm, reset} from 'redux-form'
import moment from 'moment-timezone'

import ChapterFormComponent from 'src/common/components/ChapterForm'
import {chapterSchema, validationErrorToReduxFormErrors} from 'src/common/validations'
import {getChapter, saveChapter, addInviteCodeToChapter} from 'src/common/actions/chapter'

function asyncValidate(values) {
  return new Promise((resolve, reject) => {
    chapterSchema.validate(values, {abortEarly: false})
      .then(() => resolve())
      .catch(error => reject(validationErrorToReduxFormErrors(error)))
  })
}

function handleSubmitForm(dispatch) {
  return chapterInfo => {
    dispatch(saveChapter(chapterInfo))
  }
}

function createAndAddInviteCode(dispatch) {
  return inviteCodeFormData => {
    const {chapterId, code, description, roles} = inviteCodeFormData
    const inviteCode = {code, description, roles: roles.split(/\W+/)}
    dispatch(reset('inviteCode'))
    dispatch(addInviteCodeToChapter(chapterId, inviteCode))
  }
}

class WrappedChapterForm extends Component {
  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  static fetchData(dispatch, props) {
    const {params: {id}} = props
    if (id) {
      dispatch(getChapter(id))
    }
  }

  render() {
    return <ChapterFormComponent {...this.props}/>
  }
}

WrappedChapterForm.propTypes = {
  dispatch: PropTypes.func.isRequired,
}

export default reduxForm({
  form: 'chapter',
  fields: ['id', 'name', 'channelName', 'timezone', 'goalRepositoryURL', 'cycleDuration', 'cycleEpochDate', 'cycleEpochTime'],
  asyncBlurFields: ['name', 'channelName', 'timezone', 'goalRepositoryURL', 'cycleDuration', 'cycleEpochDate', 'cycleEpochTime'],
  asyncValidate,
}, (state, props) => {
  const {id} = props.params
  const {chapters, isBusy} = state.chapters
  const chapter = chapters[id]
  const inviteCodes = chapter && chapter.inviteCodes
  let formType = chapter ? 'update' : 'new'
  if (id && !chapter && !isBusy) {
    formType = 'notfound'
  }
  const timezone = moment.tz.guess()
  const cycleEpochDate = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const cycleEpochTime = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const initialValues = Object.assign({}, {id, timezone, cycleEpochDate, cycleEpochTime}, chapter)

  return {
    initialValues,
    isBusy,
    formType,
    inviteCodes,
    showCreateInviteCode: true,
  }
}, dispatch => ({
  onSubmit: handleSubmitForm(dispatch),
  onCreateInviteCode: createAndAddInviteCode(dispatch),
}))(WrappedChapterForm)
