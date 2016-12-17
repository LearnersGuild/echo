import getBullQueue from 'bull'
import raven from 'raven'

import {parseQueryError} from 'src/server/db/errors'
import config from 'src/config'

const sentry = new raven.Client(config.server.sentryDSN)

export function getQueue(queueName) {
  return getBullQueue(queueName, config.server.redis.url)
}

export function emptyQueue(queueName) {
  return getQueue(queueName).empty()
}

const _defaultErrorHandler = () => null
export function processJobs(queueName, processor, onFailed = _defaultErrorHandler) {
  _assertIsFunction(processor, 'processor (2nd argument)')
  _assertIsFunction(onFailed, 'onFailed (3rd argument)')

  const queue = getQueue(queueName)

  queue.process(async job => {
    const {data, queue: {name: queueName}, jobId, attemptsMade} = job
    const currentAttemptNumber = attemptsMade + 1

    await processor(data)

    console.log(`${queueName} job ${jobId} (attempt=${currentAttemptNumber}) succeeded.`)
  })

  queue.on('failed', async (job, failure) => {
    const {data, queue: {name: queueName}, jobId, attemptsMade, attempts} = job

    console.error(`${queueName} job ${jobId} (attempt=${attemptsMade}) failed:`, failure.stack)
    failure = parseQueryError(failure)
    sentry.captureException(failure)

    if (attemptsMade >= attempts) {
      try {
        await onFailed(data, failure)
      } catch (err) {
        console.error('Job recovery unsuccessful:', err.stack)
        sentry.captureException(err)
      }
    }
  })

  queue.on('error', err => {
    console.error(`Error with job queue ${queue.name}:`, err.stack)
    sentry.captureException(err)
  })

  _setupCompletedJobCleaner(queueName, queue)
}

function _setupCompletedJobCleaner(queueName, queue) {
  /* eslint-disable no-implicit-coercion */
  const day = 1000 * 86400
  const cleanJobs = () => {
    queue.clean(30 * day, 'completed')
    queue.clean(90 * day, 'failed')
  }

  queue.on('cleaned', (jobs, type) => {
    console.log(`Cleaned ${jobs.length} ${type} jobs from ${queueName} queue`)
  })

  // Clean on startup
  cleanJobs()

  // Clean periodically
  setInterval(cleanJobs, 1 * day)
}

function _assertIsFunction(func, name) {
  if (typeof func !== 'function') {
    throw new Error(`${name} must be a function`)
  }
}
