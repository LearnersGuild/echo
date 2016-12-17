export * from './chapter'
export * from './cycle'
export * from './inviteCode'

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
