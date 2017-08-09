/* eslint-disable camelcase */
import Promise from 'bluebird'

import getMemberUser from 'src/server/actions/getMemberUser'
import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Project, Response} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import {LGBadRequestError} from 'src/server/util/error'
import {writeCSV} from './util'

const HEADERS = [
  'subject_handle',
  'subject_name',
  'cycle_number',
  'project_name',
  'respondent_handle',
  'respondent_name',
  'feedback_type_descriptor',
  'response_type',
  'response_value',
  'question_body',
]

export default async function handleRequest(req, res) {
  const {handle} = req.query
  if (!handle) {
    throw new LGBadRequestError('Must provide user handle (ex: ?handle=supercooluser)')
  }

  const userHandle = String(handle).trim()
  const memberUser = await getMemberUser(userHandle)
  if (!memberUser) {
    throw new LGBadRequestError(`User not found for handle ${userHandle}`)
  }

  const reportRows = await generateReport(memberUser)

  res.setHeader('Content-disposition', `attachment; filename=memberRetroFeedback_${userHandle}.csv`)
  return writeCSV(reportRows, res, {headers: HEADERS})
}

async function generateReport(memberUser) {
  const projects = await _findMemberProjects(memberUser.id)

  return Promise.reduce(projects, async (result, project) => {
    const {cycle} = project
    const [retroSurveyResponses, projectMembers] = await Promise.all([
      _getSurveyResponsesForSubject(memberUser.id, project.retrospectiveSurveyId),
      findMemberUsers(project.memberIds),
    ])

    const projectMemberMap = mapById(projectMembers)

    const reportRows = retroSurveyResponses.map(response => {
      const respondent = projectMemberMap.get(response.respondentId)
      if (!respondent) {
        console.warn('Survey response found for user no longer a member of project')
        return result
      }

      return {
        subject_handle: memberUser.handle,
        subject_name: memberUser.name,
        cycle_number: cycle.cycleNumber,
        project_name: project.name,
        respondent_handle: respondent.handle,
        respondent_name: respondent.name,
        feedback_type_descriptor: response.question.feedbackType.descriptor,
        response_type: response.question.responseType,
        response_value: response.value,
        question_body: response.question.body,
      }
    })

    return result.concat(reportRows)
  }, [])
}

function _getSurveyResponsesForSubject(subjectId, surveyId) {
  return Response
    .filter({subjectId, surveyId})
    .getJoin({question: {feedbackType: true}})
    .orderBy('questionId', 'respondentId')
}

function _findMemberProjects(memberId) {
  return Project
    .filter(row => row('memberIds').contains(memberId))
    .getJoin({cycle: true})
    .orderBy('createdAt')
}
