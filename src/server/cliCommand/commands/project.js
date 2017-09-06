import config from 'src/config'

import {userCan} from 'src/common/util'
import findActiveProjectsForMember from 'src/server/actions/findActiveProjectsForMember'
import {Project, findProjectByNameForMember} from 'src/server/services/dataService'
import {LGCLIUsageError, LGNotAuthorizedError} from 'src/server/util/error'

import {deprecatedCommand} from '../util'

async function _getCurrentProjectForUser(user) {
  const activeProjects = await findActiveProjectsForMember(user.id)
  return activeProjects.length === 1 ? activeProjects[0] : null
}

async function _setProjectArtifactURL(user, projectName, url) {
  if (!userCan(user, 'setProjectArtifact')) {
    throw new LGNotAuthorizedError()
  }

  const project = projectName ?
    await findProjectByNameForMember(projectName, user.id) :
    await _getCurrentProjectForUser(user)

  if (!project) {
    throw new LGCLIUsageError('Must specify a valid project name')
  }

  return Project.get(project.id).updateWithTimestamp({artifactURL: url})
}

function _parseArgs(args) {
  let projectName
  let artifactURL
  if (args._.length === 2) {
    projectName = args._[0].replace(/^#/, '')
    artifactURL = args._[1]
  } else if (args._.length === 1) {
    artifactURL = args._[0]
  } else {
    throw new LGCLIUsageError()
  }

  return {projectName, artifactURL}
}

const subcommands = {
  'set-artifact': async (args, {user}) => {
    const {projectName, artifactURL} = await _parseArgs(args)
    const project = await _setProjectArtifactURL(user, projectName, artifactURL)
    return {
      text: `Thanks! The artifact for #${project.name} is now set to ${artifactURL}`,
    }
  },

  list: async () => {
    const url = `${config.app.baseURL}/projects`
    return deprecatedCommand('/project list', url)
  },
}

export default async function invoke(args, options) {
  if (args._.length >= 1) {
    const subcommand = args._[0]
    return await subcommands[subcommand](args.$[subcommand], options)
  }

  throw new LGCLIUsageError()
}
