import {Member, Project, filterProjectsWithWorkPlansForMember} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function findWorkPlanSurveysForMember(memberIdentifier) {
  if (!memberIdentifier) {
    throw new LGBadRequestError(`Invalid member identifier: ${memberIdentifier}`)
  }

  let member
  try {
    member = typeof memberIdentifier === 'string' ?
      await Member.get(memberIdentifier) : memberIdentifier
  } catch (err) {
    member = null // ignore thinky error if not found
  }

  if (!member || !member.id) {
    throw new LGBadRequestError(`Member not found for identifier: ${memberIdentifier}`)
  }

  return await Project.filter(filterProjectsWithWorkPlansForMember(member.id))
}
