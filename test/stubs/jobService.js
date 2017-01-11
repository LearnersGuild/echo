import {stub} from 'sinon'

import jobService from 'src/server/services/jobService'

export default {
  enable() {
    stub(jobService, 'createJob', () => {})
    stub(jobService, 'processJobs', () => null)
  },

  disable() {
    jobService.createJob.restore()
    jobService.processJobs.restore()
  },
}
