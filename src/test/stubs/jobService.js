import jobService from 'src/server/services/jobService'
import stubServiceAPIs from './util'

const stubbedAPIs = stubServiceAPIs(jobService, {
  createJob: () => Promise.resolve({}),
  processJobs: () => Promise.resolve(null),
})

export default stubbedAPIs
