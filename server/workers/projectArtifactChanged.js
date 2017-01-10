import * as chatService from 'src/server/services/chatService'
import {processJobs} from 'src/server/services/jobService'

export function start() {
  processJobs('projectArtifactChanged', processProjectArtifactChanged)
}

export async function processProjectArtifactChanged(project, chatClient = chatService) {
  console.log(`Project artifact for project #${project.name} changed to ${project.artifactURL}`)
  await sendProjectArtifactChangedAnnouncement(project, chatClient)
}

function sendProjectArtifactChangedAnnouncement(project, chatClient) {
  const announcement = `🔗 * The [artifact](${project.artifactURL}) for #${project.name} has been updated*.`
  return chatClient.sendChannelMessage(project.name, announcement)
}
