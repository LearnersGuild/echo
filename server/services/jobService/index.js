import raven from 'raven'

import config from 'src/config'
import {parseQueryError} from 'src/server/db/errors'

const sentry = new raven.Client(config.server.sentryDSN)

/**
 * NOTE: this service's functions are exported the way they are to enable
 * certain stubbing functionality functionality for testing that relies on the
 * way the module is cached and later required by dependent modules.
 */
export default {
  createJob,
  processJobs,
}

function createJob(jobQueueName, jobPayload, jobOptions) {
  const queueService = require('src/server/services/queueService')
  return queueService.getQueue(jobQueueName).add(jobPayload, jobOptions)
}

function processJobs(jobQueueName, processor, onFailed = () => null) {
  const queueService = require('src/server/services/queueService')

  _assertIsFunction(processor, 'processor (2nd argument)')
  _assertIsFunction(onFailed, 'onFailed (3rd argument)')

  const jobQueue = queueService.getQueue(jobQueueName)

  jobQueue.process(async job => {
    const {data, queue, jobId, attemptsMade} = job
    const currentAttemptNumber = attemptsMade + 1

    await processor(data)

    console.log(`${queue.name} job ${jobId} (attempt=${currentAttemptNumber}) succeeded.`)
  })

  jobQueue.on('failed', async (job, failure) => {
    const {data, queue, jobId, attemptsMade, attempts} = job

    console.error(`${queue.name} job ${jobId} (attempt=${attemptsMade}) failed:`, failure.stack)
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

  jobQueue.on('error', err => {
    console.error(`Error with job queue ${jobQueue.name}:`, err.stack)
    sentry.captureException(err)
  })

  _setupCompletedJobCleaner(jobQueue)
}

function _setupCompletedJobCleaner(jobQueue) {
  const day = 1000 * 86400

  const cleanJobs = () => {
    jobQueue.clean(30 * day, 'completed')
    jobQueue.clean(90 * day, 'failed')
  }

  jobQueue.on('cleaned', (jobs, type) => {
    console.log(`Cleaned ${jobs.length} ${type} jobs from ${jobQueue.name} queue`)
  })

  // Clean on startup
  cleanJobs()

  // Clean periodically
  setInterval(cleanJobs, day)
}

function _assertIsFunction(func, name) {
  if (typeof func !== 'function') {
    throw new Error(`${name} must be a function`)
  }
}
