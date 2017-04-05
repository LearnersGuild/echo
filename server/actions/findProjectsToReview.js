import {Project} from 'src/server/services/dataService'

import {PROJECT_STATES} from 'src/common/models/project'

export async function findProjectsToReview(playerId) {
  const projects = await Project.filter({state: PROJECT_STATES.REVIEW})
  console.log('>>DUMP:', JSON.stringify(projects, null, 4))
  return projects
}
