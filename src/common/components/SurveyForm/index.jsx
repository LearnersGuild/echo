/**
 * SurveyForm
 * A dumb component that akes an array of fields, renders an appropriate
 * input for each field's type, and passes a new array of the same fields
 * fields with modified values on submission.
 */
import React, {PropTypes} from 'react'
import Button from 'react-toolbox/lib/button'
import FontIcon from 'react-toolbox/lib/font_icon'
import {Field} from 'redux-form'

import {FORM_INPUT_TYPES} from 'src/common/util/survey'

import Flex from 'src/common/components/Layout'
import SurveyFormInputText from 'src/common/components/SurveyFormInputText'
import SurveyFormInputNumeric from 'src/common/components/SurveyFormInputNumeric'
import SurveyFormInputRadio from 'src/common/components/SurveyFormInputRadio'
import SurveyFormInputSliderGroup from 'src/common/components/SurveyFormInputSliderGroup'
import {validateText, validateNumber, validateNumberGroup} from 'src/common/validations'

import styles from './index.css'

class SurveyForm extends React.Component {
  constructor(props) {
    super(props)
    this.renderFieldInput = this.renderFieldInput.bind(this)
  }

  validateFieldInput(field) {
    if (field) {
      switch (field.type) {
        case FORM_INPUT_TYPES.TEXT:
          return value => validateText(value, field.validate)
        case FORM_INPUT_TYPES.NUMERIC:
        case FORM_INPUT_TYPES.PERCENTAGE:
        case FORM_INPUT_TYPES.RADIO:
          return value => validateNumber(value, field.validate)
        case FORM_INPUT_TYPES.SLIDER_GROUP:
          return items => {
            const values = (items || []).map(item => item.value)
            return validateNumberGroup(values, field.validate)
          }
        default:
          return value => validateText(value, field.validate)
      }
    }
  }

  renderFieldInput(field) {
    const {input: {onChange: handleChange}} = field
    switch (field.type) {
      case FORM_INPUT_TYPES.TEXT:
        return (
          <SurveyFormInputText
            name={field.name}
            hint={field.hint}
            value={field.input.value || ''}
            onChange={handleChange}
            />
        )

      case FORM_INPUT_TYPES.NUMERIC:
      case FORM_INPUT_TYPES.PERCENTAGE:
        return (
          <SurveyFormInputNumeric
            name={field.name}
            hint={field.hint}
            value={isNaN(field.input.value) ? null : field.input.value}
            onChange={handleChange}
            />
        )

      case FORM_INPUT_TYPES.RADIO:
        return (
          <SurveyFormInputRadio
            name={field.name}
            options={field.options}
            value={isNaN(field.input.value) ? null : field.input.value}
            onChange={handleChange}
            />
        )

      case FORM_INPUT_TYPES.SLIDER_GROUP:
        return (
          <SurveyFormInputSliderGroup
            sum={100}
            name={field.name}
            hint={field.hint}
            options={field.options}
            value={field.input.value || []}
            onChange={handleChange}
            />
        )

      default:
        return null
    }
  }

  renderFields() {
    return (
      <Flex flexDirection="column" width="100%" className={styles.body}>
        {this.props.fields.map((field, i) => {
          return (
            <div key={i} className={styles.fieldWrapper}>
              <h6 className={styles.fieldLabel}>{field.label}</h6>
              <Field
                name={field.name}
                component={this.renderFieldInput}
                validate={this.validateFieldInput(field)}
                props={field}
                />
            </div>
          )
        })}
      </Flex>
    )
  }

  render() {
    const {
      name,
      title,
      handleSubmit,
      submitLabel,
      submitDisabled,
      onClickSubmit,
      backLabel,
      backDisabled,
      onClickBack,
      showBackButton,
      invalid,
      submitting,
    } = this.props
    const disableSubmit = submitDisabled || invalid || submitting
    const backButton = showBackButton ? (
      <Button disabled={backDisabled} onClick={onClickBack} raised>
        <FontIcon value="keyboard_arrow_left"/>
        <span className={styles.backButtonText}>{backLabel || 'Back'}</span>
      </Button>
    ) : null
    return (
      <Flex width="100%" flexDirection="column" className={styles.container}>
        <form id={name} onSubmit={handleSubmit ? handleSubmit(onClickSubmit) : onClickSubmit}>
          <h5>{title || ''}</h5>

          {this.props.fields ? this.renderFields() : this.props.content}

          <Flex
            width="100%"
            className={styles.footer}
            justifyContent={backButton ? 'space-between' : 'flex-end'}
            >
            {backButton}
            <Button
              type="submit"
              label={submitLabel || 'Submit'}
              disabled={disableSubmit}
              raised
              primary
              />
          </Flex>
        </form>
      </Flex>
    )
  }
}

SurveyForm.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    hint: PropTypes.string,
    value: PropTypes.any,
    options: PropTypes.array,
    validate: PropTypes.object,
  })),
  content: PropTypes.any,
  handleSubmit: PropTypes.func,
  submitLabel: PropTypes.string,
  submitDisabled: PropTypes.bool,
  onClickSubmit: PropTypes.func,
  backLabel: PropTypes.string,
  backDisabled: PropTypes.bool,
  onClickBack: PropTypes.func,
  showBackButton: PropTypes.bool,
  invalid: PropTypes.bool,
  submitting: PropTypes.bool,
}

export default SurveyForm
