import config from 'src/config'

import {userCan} from 'src/common/util'
import {update as updateProject, findProjectByNameForPlayer} from 'src/server/db/project'
import {LGNotAuthorizedError, LGInternalServerError} from 'src/server/util/error'

import {CLIUsageError, deprecatedCommand} from '../util'

async function _setProjectArtifactURL(user, projectName, url) {
  if (!userCan(user, 'setProjectArtifact')) {
    throw new LGNotAuthorizedError()
  }

  const project = await (findProjectByNameForPlayer(projectName, user.id)
    .catch(() => {
      throw new LGInternalServerError(`No such project ${projectName}.`)
    }))
  project.artifactURL = url

  const result = await updateProject(project, {returnChanges: true})
  if (result.replaced) {
    return result.changes[0].new_val
  }

  throw new LGInternalServerError('Failed to update project artifactURL')
}

const subcommands = {
  'set-artifact': async (args, {user}) => {
    const [projectNameOrChannel, url] = args._
    const projectName = projectNameOrChannel.replace(/^#/, '')

    await _setProjectArtifactURL(user, projectName, url)

    return {
      text: `Thanks! The artifact for #${projectName} is now set to ${url}`,
    }
  },

  list: async () => {
    const url = `${config.app.baseURL}/projects`
    return deprecatedCommand('/project list', url)
  },
}

export async function invoke(args, options) {
  if (args._.length >= 1) {
    const subcommand = args._[0]
    return await subcommands[subcommand](args.$[subcommand], options)
  }

  throw new CLIUsageError()
}
