import logger from 'src/server/util/logger'
import findUsers from 'src/server/actions/findUsers'
import saveProject from 'src/server/actions/saveProject'
// TODO: check if getChapter, below, is correct
import {getChapter, getCycleForChapter, getProject} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function importProject(data = {}) {
  const {projectIdentifier, members, descriptionURL} = await _parseProjectInput(data)

  const chapter = getChapter(members[0].chapterId)
  const cycle = getCycleForChapter(chapter.id)
  const project = await _validateProject(projectIdentifier, {chapter, cycle})

  const projectValues = {
    cycleId: cycle.id,
    phaseId: members[0].phaseId,
    chapterId: chapter.id,
    memberIds: members.map(p => p.id),
    descriptionURL,
  }
  if (project) {
    projectValues.id = project.id
  } else {
    projectValues.name = data.projectIdentifier
  }

  const savedProject = await saveProject(projectValues)

  logger.log(`Project imported: #${savedProject.name} (${savedProject.id})`)

  return savedProject
}

async function _parseProjectInput(data) {
  const {
    projectIdentifier,
    memberIdentifiers = [],
    descriptionURL,
  } = data || {}

  const [members] = await Promise.all([
    _validateMembers(memberIdentifiers),
  ])

  return {projectIdentifier, members, descriptionURL}
}

async function _validateMembers(userIdentifiers = []) {
  if (!Array.isArray(userIdentifiers) || userIdentifiers.length === 0) {
    throw new LGBadRequestError('Must specify at least one project member')
  }

  const userOptions = {idmFields: ['id', 'handle']}
  const memberUsers = userIdentifiers.length > 0 ? await findUsers(userIdentifiers, userOptions) : []

  const memberPhaseIds = new Map()
  const members = userIdentifiers.map(userIdentifier => {
    const memberUser = memberUsers.find(u => (u.handle === userIdentifier || u.id === userIdentifier))
    if (!memberUser) {
      throw new LGBadRequestError(`Users not found for identifier ${userIdentifier}`)
    }
    if (!memberUser.phaseId) {
      throw new LGBadRequestError(`All project members must be in a phase. User ${memberUser.handle} is not assigned to any phase.`)
    }
    memberPhaseIds.set(memberUser.phaseId, true)
    return memberUser
  })

  if (memberPhaseIds.size > 1) {
    throw new LGBadRequestError('Project members must be in the same phase.')
  }

  return members
}

async function _validateProject(projectIdentifier, {chapter, cycle}) {
  let project
  if (projectIdentifier) {
    project = await getProject(projectIdentifier)
    if (project) {
      if (project.chapterId !== chapter.id) {
        throw new LGBadRequestError(`Project ${project.name} chapter ID (${project.chapterId}) does not match chapter ${chapter.name} ID (${chapter.id})`)
      }
      if (project.cycleId !== cycle.id) {
        throw new LGBadRequestError(`Project ${project.name} cycle ID (${project.cycleId}) does not match cycle ${cycle.cycleNumber} ID (${cycle.id})`)
      }
    }
  }
  return project
}
