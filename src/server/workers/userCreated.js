import config from 'src/config'
import {logRejection} from 'src/server/util'
import {Chapter, Member, Phase} from 'src/server/services/dataService'
import {LEARNER} from 'src/common/models/user'

const DEFAULT_PHASE_NUMBER = 1

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userCreated', processUserCreated)
}

export async function processUserCreated(idmUser) {
  try {
    if (!idmUser.inviteCode) {
      throw new Error(`Invalid invite code for user user with id ${idmUser.id}; unable to determine chapter assignment`)
    }

    const chapters = await Chapter.getAll(idmUser.inviteCode, {index: 'inviteCodes'})
    if (chapters.length === 0) {
      throw new Error(`no chapter found with inviteCode ${idmUser.inviteCode} from user with id ${idmUser.id}`)
    }

    const chapter = chapters[0]

    const newMember = {
      id: idmUser.id,
      chapterId: chapter.id,
    }

    if (idmUser.roles.includes(LEARNER)) {
      const defaultPhase = (await Phase.getAll(DEFAULT_PHASE_NUMBER, {index: 'number'}))[0]
      if (!defaultPhase) {
        throw new Error('Phase not found for default number', DEFAULT_PHASE_NUMBER)
      }

      newMember.phaseId = defaultPhase.id
    }

    await Member.upsert(newMember)

    try {
      await _addUserToChapterGitHubTeam(idmUser.handle, chapter.githubTeamId)
    } catch (err) {
      console.error(`Unable to add member ${idmUser.id} to github team ${chapter.githubTeamId}: ${err}`)
    }

    /* TODO: move to IDM service */ // eslint-disable-line
    try {
      await _notifyCRMSystemOfMemberSignUp(idmUser)
    } catch (err) {
      console.error(`Unable to notify CRM of member signup for user ${idmUser.id}: ${err}`)
    }
  } catch (err) {
    throw new Error(`Unable to save user updates ${idmUser.id}: ${err}`)
  }
}

function _notifyCRMSystemOfMemberSignUp(idmUser) {
  const crmService = require('src/server/services/crmService')
  return config.server.crm.enabled === true ?
    logRejection(crmService.notifyContactSignedUp(idmUser.email), 'Error while contacting CRM System.') :
    Promise.resolve()
}

async function _addUserToChapterGitHubTeam(userHandle, githubTeamId) {
  const {addUserToTeam} = require('src/server/services/gitHubService')
  console.log(`Adding ${userHandle} to GitHub team ${githubTeamId}`)
  return logRejection(addUserToTeam(userHandle, githubTeamId), 'Error while adding user to chapter GitHub team.')
}
