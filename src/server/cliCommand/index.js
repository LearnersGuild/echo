import express from 'express'
import raven from 'raven'

import config from 'src/config'
import getMemberUser from 'src/server/actions/getMemberUser'
import {
  LGCLIUsageError,
  LGNotAuthorizedError,
  formatServerError
} from 'src/server/util/error'

import {getCommand, parseCommand, GUILD_COLORS} from './util'

const sentry = new raven.Client(config.server.sentryDSN)

async function authenticateCommand(req, res, next) {
  try {
    const {handle, token} = parseCommand(req.body)
    if (token !== config.server.cli.token) {
      if (!req.user) {
        throw new LGNotAuthorizedError('Your CLI authorization token does not match.')
      }
    } else {
      req.user = await getMemberUser(handle)
    }
    next()
  } catch (err) {
    next(err)
  }
}

async function invokeCommand(req, res, next) {
  const {command, argv, responseURL} = parseCommand(req.body)
  try {
    const {commandSpec, commandImpl} = getCommand(command)
    let args
    try {
      args = commandSpec.parse(argv)
    } catch (err) {
      throw new LGCLIUsageError(err.message || err)
    }

    let result = commandSpec.usage(args)
    if (result) {
      // pre-format usage text as "code"
      result = {text: `\`\`\`${result}\`\`\``}
    } else {
      result = await commandImpl.invoke(args, {user: req.user, responseURL})
    }

    res.status(200).json(result)
    next()
  } catch (err) {
    next(err)
  }
}

const app = new express.Router()
app.post('/command', authenticateCommand, invokeCommand)

// Slack expects a certain style of error message to be returned, so we
// won't propagate errors to the catch-all server handler
app.use('/command', (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('CLI ERROR:', err)
  const formattedErr = formatServerError(err)
  const result = {
    /* eslint-disable camelcase */
    response_type: 'ephemeral',
    text: 'Error while executing CLI command. Please try again.',
    attachments: [{
      color: GUILD_COLORS.ERROR,
      text: formattedErr.message || 'Unknown error.',
      mrkdwn_in: ['text'],
    }],
    /* eslint-enable camelcase */
  }
  let {statusCode = 500} = formattedErr
  if (statusCode >= 500) {
    console.error(formattedErr.stack || formattedErr)
    sentry.captureException(formattedErr)
  } else {
    // For what would normally be 400 errors or any non fatal errors
    // use a 200 status code to comply with the Slack API
    statusCode = 200
  }

  res.status(statusCode).json(result)
})

export default app
