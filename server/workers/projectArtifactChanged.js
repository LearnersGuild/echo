export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectArtifactChanged', processProjectArtifactChanged)
}

export async function processProjectArtifactChanged(project) {
  const chatService = require('src/server/services/chatService')

  console.log(`Project artifact for project #${project.name} changed to ${project.artifactURL}`)

  const announcement = `🔗 * The [artifact](${project.artifactURL}) for #${project.name} has been updated*.`
  return chatService.sendChannelMessage(project.name, announcement)
}
