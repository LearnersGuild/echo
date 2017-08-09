import validate from 'validate.js'

export * from './chapter'
export * from './cycle'
export * from './inviteCode'
export * from './member'
export * from './project'

export function validationErrorToReduxFormErrors(error) {
  const errorMap = {}
  error.errors.forEach(msg => {
    const [, field, message] = msg.match(/(\w+)\s+(.*)/)
    if (!errorMap._error) {
      errorMap._error = 'Validation failed'
    }
    errorMap[field] = message
  })
  return errorMap
}

export function asyncValidate(schema, options = {}) {
  const transform = options.transform || (values => values)
  return function (values) {
    return schema
      .validate(transform(values), options)
      .then(() => {})
      .catch(err => {
        throw validationErrorToReduxFormErrors(err)
      })
  }
}

export function validateText(value, options = {}) {
  const schema = {length: {}}
  if (options.required) {
    schema.presence = true
  }
  if (!isNaN(options.length)) {
    schema.length.is = options.length
  }
  if (!isNaN(options.min)) {
    schema.length.minimum = options.min
  }
  if (!isNaN(options.max)) {
    schema.length.maximum = options.max
  }
  return _parseResult(validate.single(value, schema))
}

export function validateNumber(value, options = {}) {
  const schema = {numericality: {}}
  if (options.required) {
    schema.presence = true
  }
  if (options.integer) {
    schema.numericality.onlyInteger = true
  }
  if (!isNaN(options.min)) {
    schema.numericality.greaterThanOrEqualTo = options.min
  }
  if (!isNaN(options.max)) {
    schema.numericality.lessThanOrEqualTo = options.max
  }
  return _parseResult(validate.single(value, schema))
}

export function validateNumberGroup(values, options = {}) {
  if (!values) {
    if (options.required) {
      return 'can\'t be blank'
    }
    return
  }
  if (!Array.isArray(values)) {
    return 'must be an array'
  }

  const result = {errors: []}
  if (Number.isFinite(options.sum)) {
    result.sum = values.reduce((sum, value) => {
      sum += value || 0
      const errors = validateNumber(value, options)
      if (errors) {
        result.errors.push(errors)
      }
      return sum
    }, 0)

    if (result.sum !== options.sum) {
      result.errors.push(`sum must be equal to ${options.sum}`)
    }
  }

  return _parseResult(result.errors)
}

function _parseResult(result) {
  return result && result.length > 0 ? result.join('\n') : undefined
}
