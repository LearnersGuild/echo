import {processJobs} from 'src/server/util/queue'
import initializeProjectChannel from 'src/server/actions/initializeProjectChannel'
import {Project} from 'src/server/services/dataService'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import ChatClient from 'src/server/clients/ChatClient'

export function start() {
  processJobs('projectCreated', handleProjectCreated)
}

export async function handleProjectCreated(event, {chatClient = new ChatClient()} = {}) {
  const project = await Project.get(event.projectId)
  const players = await getPlayerInfo(project.playerIds)
  await initializeProjectChannel(project, players, {chatClient})
}
