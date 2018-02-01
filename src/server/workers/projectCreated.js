import ensureWorkPlanSurveyExists from 'src/server/actions/ensureWorkPlanSurveyExists'
import reloadDefaultModelData from 'src/server/actions/reloadDefaultModelData'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectCreated', processProjectCreated)
}

export async function processProjectCreated(project) {
  await reloadDefaultModelData()
  await ensureWorkPlanSurveyExists(project)
}
