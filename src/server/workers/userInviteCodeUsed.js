import createMemberForInviteCode from 'src/server/actions/createMemberForInviteCode'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userInviteCodeUsed', processUserInviteCodeUsed)
}

export async function processUserInviteCodeUsed(user) {
  try {
    await createMemberForInviteCode(user.id, user.inviteCode)
  } catch (err) {
    throw new Error(`Unable to save user updates ${user.id}: ${err}`)
  }
}
