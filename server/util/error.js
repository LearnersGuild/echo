import {GraphQLError} from 'graphql/error'

import {parseQueryError} from 'src/server/db/errors'

export class LGCustomQueryError extends Error {
  constructor(message) {
    super(message)
    this.message = message || 'There was a problem with the query.'
    this.name = 'LGCustomQueryError'
  }
}

export class LGInternalServerError extends Error {
  constructor(value) {
    if (typeof value === 'string') {
      super(value)
    } else {
      super()
      this.message = 'An internal server error occurred'
      if (value instanceof Error) {
        this.originalError = value
      }
    }
    this.name = 'LGInternalServerError'
    this.statusCode = 500
  }
}

export class LGTokenExpiredError extends Error {
  constructor(value) {
    if (typeof value === 'string') {
      super(value)
    } else {
      super()
      this.message = 'Your authentication token has expired.'
      if (value instanceof Error) {
        this.originalError = value
      }
    }
    this.name = 'LGTokenExpiredError'
    this.statusCode = 401
  }
}

export function formatServerError(origError) {
  const queryError = parseQueryError(origError)

  if (queryError.name === 'BadInputError' || queryError.name === 'LGCustomQueryError') {
    return _badRequestError(queryError)
  } else if (/Reql\w+Error/.test(origError.name) || (origError.originalError &&
      /Reql\w+Error/.test(origError.originalError.name))) {
    // RethinkDb errors masked as internal errors
    return _internalServerError(origError)
  } else if (origError.name === 'BadRequestError') {
    return _badRequestError(origError)
  } else if (origError.name === 'TokenExpiredError') {
    return _tokenExpiredError(origError)
  } else if (!(origError instanceof GraphQLError)) {
    // any other non-graphql error masked as internal error
    return _internalServerError(origError)
  }

  return origError
}

function _badRequestError(origError) {
  const error = new Error()
  error.statusCode = origError.code || 400
  error.message = origError.message
  error.originalError = origError
  return error
}

function _tokenExpiredError(origError) {
  return new LGTokenExpiredError(origError)
}

function _internalServerError(origError) {
  return new LGInternalServerError(origError)
}
