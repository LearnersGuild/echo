import {PROJECT_STATES} from 'src/common/models/project'
import {getProject} from 'src/server/db/project'
import {Project} from 'src/server/services/dataService'
import {LGBadRequestError, LGForbiddenError} from 'src/server/util/error'

export default async function deleteProject(identifier) {
  const project = await getProject(identifier)
  if (!project) {
    throw new LGBadRequestError('Project not found')
  }

  if (project.state !== PROJECT_STATES.IN_PROGRESS) {
    throw new LGForbiddenError('Project can only be deleted if still in progress')
  }

  await Project.get(project.id).delete()
  return null
}
