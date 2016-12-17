import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm, reset, getFormValues} from 'redux-form'
import moment from 'moment-timezone'

import ChapterFormComponent from 'src/common/components/ChapterForm'
import {chapterSchema, validationErrorToReduxFormErrors} from 'src/common/validations'
import {getChapter, saveChapter, addInviteCodeToChapter} from 'src/common/actions/chapter'
import {FORM_TYPES} from 'src/common/util/form'

const FORM_NAME = 'chapter'

class WrappedChapterForm extends Component {
  static fetchData(dispatch, props) {
    const {params: {id}} = props
    if (id) {
      dispatch(getChapter(id))
    }
  }

  componentDidMount() {
    this.constructor.fetchData(this.props.dispatch, this.props)
  }

  render() {
    if (!this.props.chapter && this.props.isBusy) {
      return null
    }
    return <ChapterFormComponent {...this.props}/>
  }
}

WrappedChapterForm.propTypes = {
  isBusy: PropTypes.bool,
  chapter: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
}

function asyncValidate(values) {
  return chapterSchema
    .validate(values, {abortEarly: false})
    .then(() => {})
    .catch(err => {
      throw validationErrorToReduxFormErrors(err)
    })
}

function handleSaveChapter(dispatch) {
  return values => {
    return dispatch(saveChapter(values))
  }
}

function handleSaveInviteCode(dispatch) {
  return values => {
    const {chapterId, code, description, roles} = values
    const inviteCode = {code, description, roles: roles.split(/\W+/)}
    dispatch(reset('inviteCode'))
    return dispatch(addInviteCodeToChapter(chapterId, inviteCode))
  }
}

function mapStateToProps(state, props) {
  const {id} = props.params
  const {chapters} = state.chapters

  const chapter = chapters[id]
  const inviteCodes = chapter && chapter.inviteCodes
  const sortedInviteCodes = (inviteCodes || []).sort()
  const timezone = (chapter || {}).timezone || moment.tz.guess()
  const cycleEpochDate = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const cycleEpochTime = chapter && chapter.cycleEpoch ? new Date(chapter.cycleEpoch) : undefined
  const initialValues = Object.assign({}, {id, timezone, cycleEpochDate, cycleEpochTime}, chapter)

  let formType = chapter ? FORM_TYPES.UPDATE : FORM_TYPES.CREATE
  if (id && !chapter && !chapters.isBusy) {
    formType = FORM_TYPES.NOT_FOUND
  }

  return {
    isBusy: chapters.isBusy,
    chapter,
    initialValues,
    formType,
    inviteCodes: sortedInviteCodes,
    formValues: getFormValues(FORM_NAME)(state) || {},
    showCreateInviteCode: true,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSaveChapter: handleSaveChapter(dispatch),
    onSaveInviteCode: handleSaveInviteCode(dispatch),
  }
}

const formOptions = {
  form: FORM_NAME,
  enableReinitialize: true,
  asyncBlurFields: ['name', 'channelName', 'timezone', 'goalRepositoryURL', 'cycleDuration', 'cycleEpochDate', 'cycleEpochTime'],
  asyncValidate,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(reduxForm(formOptions)(WrappedChapterForm))
