import {renderQuestionBodies} from 'src/common/models/survey'
import findMemberUsers from 'src/server/actions/findMemberUsers'
import {Project, getFullRetrospectiveSurveyForMember} from 'src/server/services/dataService'
import {customQueryError} from 'src/server/services/dataService/util'
import {LGForbiddenError} from 'src/server/util/error'
import {hashById} from 'src/server/util'

export async function compileSurveyDataForMember(memberId, projectId) {
  const survey = await getFullRetrospectiveSurveyForMember(memberId, projectId)
    .then(survey => _inflateSurveySubjects(survey))
    .then(survey => Object.assign({}, survey, {
      questions: renderQuestionBodies(survey.questions)
    }))
  const surveyCompletedBy = survey.completedBy || []
  const surveyUnlockedFor = survey.unlockedFor || []
  if (surveyCompletedBy.includes(memberId) && !surveyUnlockedFor.includes(memberId)) {
    throw new LGForbiddenError('This survey has been completed and is locked.')
  }
  return survey
}

export function compileSurveyQuestionDataForMember(memberId, questionNumber, projectId) {
  return getFullRetrospectiveSurveyForMember(memberId, projectId)('questions')
    .nth(questionNumber - 1)
    .default(customQueryError(`There is no question number ${questionNumber}`))
    .then(question => _inflateSurveyQuestionSubjects([question]))
    .then(questions => renderQuestionBodies(questions))
    .then(questions => questions[0])
}

function _inflateSurveySubjects(survey) {
  return _inflateSurveyQuestionSubjects(survey.questions)
    .then(questions => Object.assign({}, survey, {questions}))
}

async function _inflateSurveyQuestionSubjects(questions) {
  const subjectIds = _getSubjects(questions)
  const memberInfo = await _getMemberUsersByIds(subjectIds)
  const projectInfo = await _getProjectInfoByIds(subjectIds)
  const subjectInfo = {...memberInfo, ...projectInfo}

  const inflatedQuestions = questions.map(question => {
    const inflatedSubject = question.subjectIds.map(subjectId => subjectInfo[subjectId])
    return Object.assign({}, question, {subjects: inflatedSubject})
  })

  return inflatedQuestions
}

function _getSubjects(questions) {
  return questions
    .reduce((prev, question) => prev.concat(question.subjectIds), [])
}

async function _getProjectInfoByIds(projectIds = []) {
  const projects = await Project.getAll(...projectIds)
  return projects.reduce((result, project) => ({
    ...result,
    [project.id]: {
      id: project.id,
      handle: project.name,
      name: project.name,
    },
  }), {})
}

async function _getMemberUsersByIds(memberIds) {
  return hashById(await findMemberUsers(memberIds))
}
