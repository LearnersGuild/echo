import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm, reset, getFormValues} from 'redux-form'
import moment from 'moment-timezone'

import {showLoad, hideLoad} from 'src/common/actions/app'
import ChapterForm from 'src/common/components/ChapterForm'
import {chapterSchema, asyncValidate} from 'src/common/validations'
import {getChapter, saveChapter, addInviteCodeToChapter} from 'src/common/actions/chapter'
import {FORM_TYPES} from 'src/common/util/form'

const FORM_NAMES = {
  CHAPTER: 'chapter',
  INVITE_CODE: 'inviteCode',
}

class ChapterFormContainer extends Component {
  componentDidMount() {
    this.props.showLoad()
    this.props.fetchData()
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isBusy && nextProps.loading) {
      this.props.hideLoad()
    }
  }

  render() {
    if (!this.props.chapter && this.props.isBusy) {
      return null
    }
    return <ChapterForm {...this.props}/>
  }
}

ChapterFormContainer.propTypes = {
  chapter: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

ChapterFormContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.id) {
    dispatch(getChapter(props.params.id))
  }
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
    dispatch(reset(FORM_NAMES.INVITE_CODE))
    return dispatch(addInviteCodeToChapter(chapterId, inviteCode))
  }
}

function mapStateToProps(state, props) {
  const {id} = props.params
  const {isBusy, chapters} = state.chapters

  const chapter = chapters[id]
  const inviteCodes = chapter && chapter.inviteCodes
  const sortedInviteCodes = (inviteCodes || []).sort()
  const timezone = (chapter || {}).timezone || moment.tz.guess()
  const initialValues = Object.assign({}, {id, timezone}, chapter)

  let formType = chapter ? FORM_TYPES.UPDATE : FORM_TYPES.CREATE
  if (id && !chapter && !isBusy) {
    formType = FORM_TYPES.NOT_FOUND
  }

  return {
    chapter,
    initialValues,
    formType,
    isBusy,
    loading: state.app.showLoading,
    inviteCodes: sortedInviteCodes,
    formValues: getFormValues(FORM_NAMES.CHAPTER)(state) || {},
    showCreateInviteCode: true,
  }
}

function mapDispatchToProps(dispatch, props) {
  return {
    onSaveChapter: handleSaveChapter(dispatch),
    onSaveInviteCode: handleSaveInviteCode(dispatch),
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

const formOptions = {
  form: FORM_NAMES.CHAPTER,
  enableReinitialize: true,
  asyncBlurFields: ['name', 'channelName', 'timezone', 'goalRepositoryURL'],
  asyncValidate: asyncValidate(chapterSchema, {abortEarly: false}),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(reduxForm(formOptions)(ChapterFormContainer))
