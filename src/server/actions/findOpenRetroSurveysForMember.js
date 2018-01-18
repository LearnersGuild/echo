import Promise from 'bluebird'

import {compileSurveyDataForMember} from 'src/server/actions/compileSurveyData'
import {Member, Project, filterOpenProjectsForMember} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'
import {RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'

export default async function findOpenRetroSurveysForMember(memberIdentifier) {
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

  const openProjects = await Project.filter(filterOpenProjectsForMember(member.id))

  return Promise.map(openProjects, project => (
    compileSurveyDataForMember(member.id, project.id, RETROSPECTIVE_DESCRIPTOR)
  ))
}
