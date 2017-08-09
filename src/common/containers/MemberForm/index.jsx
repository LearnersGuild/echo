import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {reduxForm} from 'redux-form'

import {showLoad, hideLoad} from 'src/common/actions/app'
import {getMember, updateMember} from 'src/common/actions/member'
import {findPhases} from 'src/common/actions/phase'
import {memberSchema, asyncValidate} from 'src/common/validations'
import MemberForm from 'src/common/components/MemberForm'
import {findAny} from 'src/common/util'
import {FORM_TYPES} from 'src/common/util/form'

const FORM_NAME = 'member'

class MemberFormContainer extends Component {
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
    if (!this.props.project && this.props.isBusy) {
      return null
    }
    return <MemberForm {...this.props}/>
  }
}

MemberFormContainer.propTypes = {
  project: PropTypes.object,
  isBusy: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
  showLoad: PropTypes.func.isRequired,
  hideLoad: PropTypes.func.isRequired,
}

MemberFormContainer.fetchData = fetchData

function fetchData(dispatch, props) {
  if (props.params.identifier) {
    dispatch(getMember(props.params.identifier))
    dispatch(findPhases())
  }
}

function handleSubmit(dispatch) {
  return values => {
    return dispatch(updateMember(values))
  }
}

function mapStateToProps(state, props) {
  const {identifier} = props.params
  const {app, members, phases} = state
  const member = findAny(members.members, identifier, ['id', 'handle'])

  const sortedPhases = Object.values(phases.phases).sort((p1, p2) => p1.number - p2.number)
  const sortedPhaseOptions = [
    {value: null, label: 'No Phase'}, ...sortedPhases.map(phaseToOption)
  ]

  let formType = FORM_TYPES.UPDATE
  if (identifier && !member && !members.isBusy) {
    formType = FORM_TYPES.NOT_FOUND
  }

  const initialValues = member ? {
    id: member.id,
    phaseNumber: member.phase ? member.phase.number : null,
  } : null

  return {
    isBusy: member.isBusy,
    loading: app.showLoading,
    phaseOptions: sortedPhaseOptions,
    formType,
    member,
    initialValues,
  }
}

function phaseToOption(phase) {
  return {value: phase.number, label: phase.number}
}

function mapDispatchToProps(dispatch, props) {
  return {
    onSave: handleSubmit(dispatch),
    fetchData: () => fetchData(dispatch, props),
    showLoad: () => dispatch(showLoad()),
    hideLoad: () => dispatch(hideLoad()),
  }
}

const formOptions = {
  form: FORM_NAME,
  enableReinitialize: true,
  asyncBlurFields: ['phaseNumber'],
  asyncValidate: asyncValidate(memberSchema, {abortEarly: false}),
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(reduxForm(formOptions)(MemberFormContainer))
