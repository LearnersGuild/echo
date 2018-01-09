import config from 'src/config'
import getMemberInfo from 'src/server/actions/getMemberInfo'
import {LGBadRequestError} from 'src/server/util/error'

export default async function sendProjectWelcomeMessages(project, options = {}) {
  const {Phase, Project} = require('src/server/services/dataService')
  const chatService = require('src/server/services/chatService')

  project = typeof project === 'string' ? await Project.get(project).getJoin({phase: true}) : project
  if (!project) {
    throw new LGBadRequestError(`Project ${project} not found; initialization aborted`)
  }

  const phase = project.phase || (project.phaseId ? await Phase.get(project.phaseId) : null)
  if (!phase) {
    console.log(`Project welcome message skipped for ${project.name}; phase not found`)
    return
  }

  const projectMembers = options.members || await getMemberInfo(project.memberIds)
  const projectMemberHandles = projectMembers.map(u => u.handle)
  const message = _buildPhaseProjectMessage(project, phase)

  try {
    await chatService.sendDirectMessage(projectMemberHandles, message)
  } catch (err) {
    console.warn(err)
  }
}

function _buildPhaseProjectMessage(project, phase) {
  return `
🎊 *You're in Phase ${phase.number} this week!* 🎊

You should find everything you need to guide you in your work at the resources below:

• <${config.server.curriculum.baseURL}|Guild Curriculum>
• <${config.server.guide.baseURL}|Learner Guide>
`
}
