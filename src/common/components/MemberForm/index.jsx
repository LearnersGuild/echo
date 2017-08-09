/* eslint-disable react/jsx-handler-names */
import React, {Component, PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'
import {Field} from 'redux-form'
import Helmet from 'react-helmet'

import ContentHeader from 'src/common/components/ContentHeader'
import NotFound from 'src/common/components/NotFound'
import {Flex} from 'src/common/components/Layout'
import {FORM_TYPES, renderDropdown} from 'src/common/util/form'

import styles from './index.scss'

class MemberForm extends Component {
  handleBlurField(event) {
    // blur event handling is causing redux state to not be
    // properly updated with selected options.
    // See: https://github.com/erikras/redux-form/issues/2229
    event.preventDefault()
  }

  render() {
    const {
      pristine,
      handleSubmit,
      submitting,
      invalid,
      formType,
      onSave,
      member,
      phaseOptions
    } = this.props

    if (formType === FORM_TYPES.NOT_FOUND) {
      return <NotFound/>
    }

    const submitDisabled = Boolean(pristine || submitting || invalid)
    const title = `Edit Member: ${member.handle}`

    return (
      <Flex column>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <ContentHeader title={title}/>
        <form id="member" onSubmit={handleSubmit(onSave)}>
          <Field name="id" type="hidden" component="hidden"/>
          <Field
            name="phaseNumber"
            type="number"
            icon="trending_up"
            label="Phase Number"
            hint={'e.g. "2"'}
            source={phaseOptions}
            auto
            component={renderDropdown}
            onBlur={this.handleBlurField}
            />
          <Flex className={styles.footer} justifyContent="space-between">
            <Button
              type="submit"
              label="Save"
              disabled={submitDisabled}
              primary
              raised
              />
          </Flex>
        </form>
      </Flex>
    )
  }
}

MemberForm.propTypes = {
  pristine: PropTypes.bool.isRequired,
  invalid: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  formType: PropTypes.oneOf(Object.values(FORM_TYPES)).isRequired,
  onSave: PropTypes.func.isRequired,
  member: PropTypes.object,
  phaseOptions: PropTypes.array,
}

export default MemberForm
