import {Project} from 'src/server/services/dataService'

export async function findProjectsToReview(playerId) {
  const projects = await Project.filter({coachId: playerId})
  console.log('>>DUMP:', JSON.stringify(projects, null, 4))
  return projects
}
