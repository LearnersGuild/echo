import React, {PropTypes} from 'react'
import DatePicker from 'react-toolbox/lib/date_picker'
import TimePicker from 'react-toolbox/lib/time_picker'
import Input from 'react-toolbox/lib/input'

/* eslint-disable react/no-unused-prop-types */
const propTypes = {
  input: PropTypes.object.isRequired,
  meta: PropTypes.object.isRequired,
}

export const FORM_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  NOT_FOUND: 'notfound',
}

export function renderInput(field) {
  return <Input {..._values(field)}/>
}
renderInput.propTypes = propTypes

export function renderDatePicker(field) {
  const {input: {value}} = field
  return <DatePicker {..._values(field)} value={value ? new Date(value) : new Date()}/>
}
renderDatePicker.propTypes = propTypes

export function renderTimePicker(field) {
  const {input: {value}} = field
  return <TimePicker {..._values(field)} value={value ? new Date(value) : new Date()} format="ampm"/>
}
renderTimePicker.propTypes = propTypes

function _values({input, meta, ...rest}) {
  return {
    ...input,
    ...rest,
    error: meta.visited && meta.error ? meta.error : null,
  }
}
